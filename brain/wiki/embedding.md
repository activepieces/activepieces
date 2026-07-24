# Embedding

How to embed the Activepieces builder iframe inside your own SaaS and auto-provision users. Enterprise feature. Source: `docs/embedding/`.

## The flow
1. **Provision users** — mirror your SaaS workspaces/users into Activepieces Projects and Users. Your backend signs a JWT (RS256) with a **Signing Key** (generate at Platform Settings → Signing Keys; you keep the private key, Activepieces stores the public key). The JWT identifies the user/project; if they already exist, it logs them in instead of recreating.
2. **Embed builder** — load the embed SDK script (`https://cdn.activepieces.com/sdk/embed/<version>.js`, no `async`/`defer`), then call `activepieces.configure({ instanceUrl, jwtToken, prefix, embedding: { containerId, builder, dashboard } })` after the container renders.

## Misc topics
- **Customize pieces** — control which pieces show in the embedded builder.
- **Embed connections** and **predefined connection** — manage/prefill connections for embedded users.
- **Embeddable MCP** — expose the MCP server in the embed.
- **Navigation** — control/hide navigation and flow name in the iframe.
- **SDK changelog** and **SDK server requests** — version history and the server-side calls the SDK makes.

Related API: `endpoints/embedding/add-allowed-embed-origins` to whitelist embedding origins.
