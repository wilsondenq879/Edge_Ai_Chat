const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const background = fs.readFileSync(path.join(root, "src/background.js"), "utf8");
const contentScript = fs.readFileSync(path.join(root, "src/content-script.js"), "utf8");

const start = background.indexOf("function createWatchtowerId()");
const end = background.indexOf("function normalizeSecretValue", start);
assert.ok(start >= 0 && end > start, "Watchtower background helpers should exist");

const context = {
  URL,
  console,
  WATCHTOWER_DEFAULT_INTERVAL_MINUTES: 60,
  WATCHTOWER_MIN_INTERVAL_MINUTES: 15,
  WATCHTOWER_MAX_INTERVAL_MINUTES: 10080,
  WATCHTOWER_MAX_BASELINE_TEXT: 16000,
  WATCHTOWER_MAX_MONITORS: 50,
  WATCHTOWER_MAX_EVENTS: 120,
  WATCHTOWER_ALARM_PREFIX: "watchtower-monitor:",
  WATCHTOWER_NOTIFICATION_PREFIX: "watchtower-notification:",
  WATCHTOWER_MONITORS_STORAGE_KEY: "watchtowerMonitorsV1",
  WATCHTOWER_EVENTS_STORAGE_KEY: "watchtowerEventsV1",
  watchtowerRunLocks: new Set(),
  normalizeTaskText: (value, maxLength) => String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength),
  normalizeTaskIsoDate: (value) => {
    const timestamp = Date.parse(String(value || ""));
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
  },
};
vm.createContext(context);
vm.runInContext(`${background.slice(start, end)}\nthis.watchtowerApi = { normalizeWatchtowerUrl, normalizeWatchtowerInterval, normalizeWatchtowerContent, hashWatchtowerContent, computeWatchtowerDiff, buildWatchtowerFallbackSummary, parseWatchtowerAgentDecision, normalizeWatchtowerMonitor, getPublicWatchtowerMonitor, buildWatchtowerAlarmName, getWatchtowerIdFromAlarmName, upsertWatchtowerMonitor, runWatchtowerCheck, setWatchtowerMonitorEnabled, deleteWatchtowerMonitor, getWatchtowerState };`, context);

const api = context.watchtowerApi;
assert.equal(api.normalizeWatchtowerUrl("https://example.com/prices#today"), "https://example.com/prices");
assert.equal(api.normalizeWatchtowerUrl("file:///tmp/test.html"), "");
assert.equal(api.normalizeWatchtowerInterval(1), 15);
assert.equal(api.normalizeWatchtowerInterval(999999), 10080);

const first = "Price:\u00a0 100\r\nAvailable";
const equivalent = "Price: 100\nAvailable";
assert.equal(api.normalizeWatchtowerContent(first), equivalent);
assert.equal(api.hashWatchtowerContent(first), api.hashWatchtowerContent(equivalent));
assert.notEqual(api.hashWatchtowerContent(first), api.hashWatchtowerContent("Price: 80\nAvailable"));

const diff = api.computeWatchtowerDiff("Price: 100\nSold out", "Price: 80\nAvailable");
assert.deepEqual(Array.from(diff.added), ["Price: 80", "Available"]);
assert.deepEqual(Array.from(diff.removed), ["Price: 100", "Sold out"]);
assert.equal(diff.addedCount, 2);
assert.equal(diff.removedCount, 2);
assert.match(api.buildWatchtowerFallbackSummary(diff), /Price: 80/);

assert.deepEqual(
  { ...api.parseWatchtowerAgentDecision('```json\n{"relevant":true,"summary":"Price dropped"}\n```') },
  { relevant: true, summary: "Price dropped" },
);
assert.equal(api.parseWatchtowerAgentDecision("not-json"), null);

const publicMonitor = api.getPublicWatchtowerMonitor({
  id: "watch-1",
  url: "https://example.com/",
  title: "Example",
  baselineText: "private snapshot",
  contentHash: "deadbeef",
  intervalMinutes: 60,
  enabled: true,
});
assert.equal(publicMonitor.id, "watch-1");
assert.equal(Object.hasOwn(publicMonitor, "baselineText"), false);
assert.equal(Object.hasOwn(publicMonitor, "contentHash"), false);
assert.equal(api.getWatchtowerIdFromAlarmName(api.buildWatchtowerAlarmName("watch-1")), "watch-1");

assert.match(background, /case "watchtower:list"/);
assert.match(background, /case "watchtower:save"/);
assert.match(background, /runWatchtowerCheck\(watchtowerId\)/);
assert.match(background, /restoreWatchtowerAlarms\(\)/);
assert.match(contentScript, /data-action="open-watchtower"/);
assert.match(contentScript, /data-action="watchtower-save-current"/);
assert.match(contentScript, /data-action="watchtower-check-now"/);

async function runIntegrationTest() {
  const storage = {};
  const createdAlarms = new Map();
  const notifications = [];
  let pageContext = {
    title: "Price page",
    url: "https://example.com/prices",
    headings: "Pricing",
    pageText: "Price: 100\nAvailable",
  };
  context.chrome = {
    storage: {
      local: {
        get: async (key) => ({ [key]: storage[key] }),
        set: async (patch) => Object.assign(storage, patch),
      },
    },
    alarms: {
      clear: async (name) => createdAlarms.delete(name),
      create: (name, config) => createdAlarms.set(name, config),
    },
    tabs: {
      query: async () => [],
    },
    notifications: {
      create: async (id, options) => notifications.push({ id, options }),
      clear: async () => true,
    },
  };
  context.getPageContextFromUrl = async () => pageContext;
  context.generateWithConfiguredProvider = async () => ({
    response: '{"relevant":true,"summary":"Condition matched"}',
  });

  const created = await api.upsertWatchtowerMonitor({
    url: "https://example.com/prices#today",
    title: "Price page",
    intervalMinutes: 30,
  });
  assert.equal(created.check.baselineCreated, true);
  assert.equal(created.monitor.lastCheckStatus, "baseline");
  assert.equal(notifications.length, 0, "baseline creation should not notify");
  assert.equal(createdAlarms.size, 1, "enabled monitor should create one alarm");

  pageContext = { ...pageContext, pageText: "Price: 80\nAvailable" };
  const changed = await api.runWatchtowerCheck(created.monitor.id, { force: true });
  assert.equal(changed.changed, true);
  assert.equal(changed.relevant, true);
  assert.equal(notifications.length, 1);
  assert.equal((await api.getWatchtowerState()).events.length, 1);

  const unchanged = await api.runWatchtowerCheck(created.monitor.id, { force: true });
  assert.equal(unchanged.changed, false);
  assert.equal((await api.getWatchtowerState()).events.length, 1, "unchanged check should not create another event");

  await api.upsertWatchtowerMonitor({
    id: created.monitor.id,
    url: "https://example.com/prices",
    title: "Price page",
    condition: "Only notify if the item is sold out",
    intervalMinutes: 30,
  });
  context.generateWithConfiguredProvider = async () => ({
    response: '{"relevant":false,"summary":"The item is still available"}',
  });
  pageContext = { ...pageContext, pageText: "Price: 80\nAvailable tomorrow" };
  const ignored = await api.runWatchtowerCheck(created.monitor.id, { force: true });
  assert.equal(ignored.changed, true);
  assert.equal(ignored.relevant, false);
  assert.equal(notifications.length, 1, "ignored change should not notify");
  assert.equal((await api.getWatchtowerState()).events.length, 2, "ignored changes should remain in event history");

  await api.setWatchtowerMonitorEnabled(created.monitor.id, false);
  assert.equal(createdAlarms.size, 0, "pausing should clear the alarm");
  const deleted = await api.deleteWatchtowerMonitor(created.monitor.id);
  assert.equal(deleted.deleted, true);
  assert.equal(deleted.monitors.length, 0);
}

runIntegrationTest()
  .then(() => console.log("watchtower monitoring tests passed"))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
