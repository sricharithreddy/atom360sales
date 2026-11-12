# Atom360 Sales — live demo

Front-end demo of the dealership sales CRM. On a laptop or desktop it shows the app
inside a phone frame, with a panel to switch between logins. On a real phone it runs
full-screen with a slim login switcher at the top.

**Live:** https://sricharithreddy.github.io/atom360sales/

| Login | Direct link |
|---|---|
| Telecaller | `/atom360sales/#telecaller` |
| Sales Executive | `/atom360sales/#sales` |
| Manager + Admin | `/atom360sales/#manager` |

Sample data only — nothing is saved to a server.

## Structure

```
index.html            showcase page (phone frame + login switcher)
telecaller.html       each login is its own page, loaded in the phone screen
sales.html
manager.html
src/apps/             the three app components
src/shell/            the showcase page
src/entries/          mounts each app full-screen
```

## Run locally

```
npm install
npm run dev
```

## Deploy

Every push to `main` builds and publishes to GitHub Pages
(`.github/workflows/deploy.yml`). To update an app, replace its file in `src/apps/`
and push.
