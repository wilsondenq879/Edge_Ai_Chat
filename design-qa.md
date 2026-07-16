# Code Block Copy Control QA

- Source visual truth: `/var/folders/gh/ftfqzpx545n454q89rqnzmkw0000gn/T/codex-clipboard-c7f6513b-6845-4071-ae2e-db7f0862a233.png`
- Reference copy used for local comparison: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-reference.png`
- Implementation screenshot, dark default: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-copy-stable.png`
- Implementation screenshot, copied state: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-copy-success.png`
- Implementation screenshot, light theme: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-copy-light.png`
- Implementation screenshot, 390px component width: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-copy-narrow.png`
- Full-view comparison evidence: `/Users/wilsondenq879/Documents/GitHub/Open_Copilot/qa/code-block-copy-comparison.png`
- Viewport: the 1374 × 1794 source and browser-rendered component were normalized to equal display widths in the comparison. The responsive pass constrains the component to 390 CSS pixels.
- State: assistant Markdown response, dark theme by default; copied-success, light-theme, and narrow-width states checked separately.

**Findings**

- No actionable P0/P1/P2 findings remain.
- Fonts and typography: the implementation keeps the existing UI and monospace font stacks, language-label casing, code weight, and line-height. The change does not override production typography.
- Spacing and layout rhythm: the copy control shares the existing language-label row and stays right-aligned. At 390px component width, the 336px header has no overflow and the 79px button remains inside it. Long code preserves horizontal scrolling inside the code surface rather than pushing the control off-screen.
- Colors and visual tokens: the dark code surface now computes to `rgba(18, 27, 40, 0.76)`, one restrained step lighter than the reference treatment. The button uses the existing cyan border family and a green success state. The light theme uses its existing pale-blue surface and explicitly keeps fenced-code backgrounds transparent.
- Image quality and asset fidelity: no image, logo, illustration, or custom icon asset is involved in this component change.
- Copy and content: every fenced code block receives a localized `複製程式碼` / `Copy code` control. Successful activation changes the label to `已複製` / `Copied` and also posts a localized status message.

**Interaction Evidence**

- The rendered Markdown regression test confirms that normal fenced code includes exactly the new `copy-code-block` action and retains the code container.
- Browser testing resolved one copy control, activated it, and observed one `已複製` success control with the `is-copied` state.
- The production handler copies the nearest fenced block's `textContent`, so language labels and surrounding prose are excluded.
- Dark, light, success, and 390px-wide states reported no browser console errors.

**Focused Comparison Evidence**

- A separate crop is not needed because the full implementation screenshot renders the language label, copy control, border, background, and readable code at inspection size. The narrow screenshot supplies the focused responsive evidence.

**Comparison History**

1. First pass: the code surface was visibly lighter than requested. The background was reduced from `rgba(22, 32, 47, 0.78)` to the subtler final token `rgba(18, 27, 40, 0.76)`.
2. Light-theme pass: inline-code background styling leaked into fenced code. A scoped light-theme `pre code` rule restored a single continuous code surface.
3. Final pass: the copy button remained visible in dark, light, copied, and 390px-wide states; no P0/P1/P2 issue remained.

**Implementation Checklist**

- [x] Lighten fenced-code backgrounds without changing the surrounding assistant message.
- [x] Add a copy control to every fenced code block.
- [x] Copy only the code text.
- [x] Add localized success and failure feedback.
- [x] Preserve starter-specific code-block actions.
- [x] Verify dark, light, success, and narrow-width states.
- [x] Run all available regression tests and synchronize `dist/`.

**Follow-up Polish**

- No P3 item is required for this change.

final result: passed
