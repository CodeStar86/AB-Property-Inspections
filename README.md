  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Deployment (GitHub Pages)

1. Push to `main` on GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow `.github/workflows/gh-pages.yml` builds with `base=/<repo>/` and publishes `dist/`.

## Local
```bash
npm install
npm run dev
npm run build
npm run preview
```
