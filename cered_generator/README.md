# CE RED Excel Generator

This folder is a standalone GitHub Pages package for the RED Excel generator.

## Files

- `index.html`
- `red_excel_generator.js`
- `src/ui.css`
- `assets/templates/red-en18031-1-template.xlsx`
- `assets/templates/red-en18031-2-template.xlsb`

## Deploy To GitHub Pages

1. Create a new GitHub repository.
2. Copy everything in this folder into the new repository root.
3. Commit and push the files.
4. In GitHub, open `Settings` > `Pages`.
5. Set `Source` to `Deploy from a branch`.
6. Select your branch, usually `main`, and set the folder to `/ (root)`.
7. Save.

After GitHub Pages finishes deploying, open:

```text
https://<your-github-user>.github.io/<repo-name>/
```

## Note

Excel generation runs locally in the browser. `Analyze Spec URL` may be blocked by browser CORS rules when the target website does not allow public cross-origin fetches.
