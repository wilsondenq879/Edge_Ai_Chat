const modeTabs = Array.from(document.querySelectorAll("[data-mode]"));
const modeBoards = Array.from(document.querySelectorAll("[data-board]"));

function setMode(mode, updateHash = true) {
  modeTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mode === mode);
  });

  modeBoards.forEach((board) => {
    board.classList.toggle("is-active", board.dataset.board === mode);
  });

  if (updateHash && window.location.hash.slice(1) !== mode) {
    window.location.hash = mode;
  }
}

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

window.addEventListener("hashchange", () => {
  const mode = window.location.hash.slice(1);
  if (modeTabs.some((tab) => tab.dataset.mode === mode)) {
    setMode(mode, false);
  }
});

const initialMode = window.location.hash.slice(1);
if (modeTabs.some((tab) => tab.dataset.mode === initialMode)) {
  setMode(initialMode, false);
}
