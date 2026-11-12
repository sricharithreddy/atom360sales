# Atom360 Sales — live demo

Front-end demo of the dealership sales CRM. On a laptop or desktop it shows the app
inside a phone frame, with a panel to switch between logins. On a real phone it runs
full-screen with a slim login switcher at the top.

**Live:** deployed on Cloudflare from `main` (see the project's URL in the Cloudflare dashboard).

| Login | Direct link |
|---|---|
| Telecaller | `/#telecaller` |
| Sales Executive | `/#sales` |
| Manager + Admin | `/#manager` |

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

Cloudflare builds every push to `main`: build command `npm run build`, deploy command
`npx wrangler deploy` (configured in `wrangler.jsonc`). To update an app, replace its
file in `src/apps/` and push.

A GitHub Pages workflow is also included but only runs when started by hand from the
Actions tab.
