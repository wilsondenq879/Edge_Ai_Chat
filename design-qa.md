# Evidence Mode Split Toggle QA

- Source visual truth: `/var/folders/gh/ftfqzpx545n454q89rqnzmkw0000gn/T/codex-clipboard-72bed5e6-c70f-40b6-b6d3-5708855cd545.png`
- Implementation screenshot, off: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/evidence-mode-split-off.png`
- Implementation screenshot, on: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/evidence-mode-split-on.png`
- Full-view comparison: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/evidence-mode-split-comparison-full.png`
- Focused status-row comparison: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/evidence-mode-split-comparison-focused.png`
- Viewport: 430 × 180 CSS pixels, matching the default split-pane width.
- State: dark theme, split mode, ready status; shortcut captured in both off and on states.

The source is a cropped HiDPI screenshot, so the comparison normalizes the panel width. The focused comparison separately normalizes the status-row crop, where the new control is located.

**Findings**

- No actionable P0/P1/P2 findings remain.
- Fonts and typography: the shortcut uses the existing UI font, 10px compact-label scale, and 800 weight already used by nearby compact controls. The two-character Traditional Chinese label remains legible.
- Spacing and layout rhythm: the shortcut is 49 × 24px at the tested breakpoint, is right-aligned with `margin-left: auto`, and preserves the existing 16px status-row gutter. The row reports equal client and scroll widths, so there is no horizontal overflow.
- Colors and visual tokens: the off state uses the existing muted gray control treatment. The on state reuses the green Evidence Mode semantic color and remains distinct from the blue ready-status dot.
- Image quality and asset fidelity: no image, logo, or custom visual asset was added or changed. The shortcut is a native button with a compact semantic state dot.
- Copy and content: the visible label is localized as `證據` / `Evidence`; the accessible label exposes the full `Evidence Mode` name and current on/off state.

**Interaction Evidence**

- The shortcut resolves to one button and reuses `data-action="toggle-evidence-mode"`, the same action as the existing large-mode sidebar control.
- Clicking the shortcut changed `aria-pressed` from `false` to `true`, changed the accessible name to `Evidence Mode: 開啟`, and rendered the green active state.
- The status row remained contained after the state change: 404px client width, 404px scroll width, and the button stayed inside the row boundary.
- Browser console errors checked: none.

**Comparison History**

1. First visual pass: no P0/P1/P2 mismatch was found in the requested status-row placement. The shortcut fit the split layout without moving the title, view switch, header actions, or ready-state label.

**Implementation Checklist**

- [x] Add a compact Evidence Mode shortcut to the status row.
- [x] Show it in split and compact modes.
- [x] Hide it in large mode, where the full sidebar control remains available.
- [x] Reuse the persisted Evidence Mode action and state.
- [x] Add dark/light, hover/focus, off/on styles.
- [x] Add regression coverage and sync the distributable extension bundle.

**Follow-up Polish**

- No P3 item is required for this change.

final result: passed
