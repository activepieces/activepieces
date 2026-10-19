---
icon: 🧪
---
# Testing Model Tiers Locally

How to see the published tier file drive chat, agents and the pickers on a dev box, without publishing anything. The server fetches through `safeHttp`, which blocks loopback, so the allow-list line is not optional.

1. Write a tier file with both lists. Put something in it that the release does not ship, such as a chat-only tier `turbo` and a relabelled `smart` ("Expert (from file)"), so you can tell the file from the bundled constants at a glance. Every tier needs `id`, `label`, `modelId` (an OpenRouter id) and `thinkingBudget`; the file needs `version`, `publishedAt`, `publishedBy`, `tiers`, `defaultTierId`, and `chatTiers` with `chatDefaultTierId` together or not at all.
2. Serve it: `python3 -m http.server 8787` in that folder.
3. In `.env.dev`: `AP_MODEL_TIERS_URL=http://127.0.0.1:8787/tiers.json` and `AP_SSRF_ALLOW_LIST=127.0.0.1`. Start with `npm run dev`. The boot log must not say "Failed to load the AI model tiers file".
4. Chat page: the picker shows the chat list, with the chat default selected on a fresh chat. Agent model picker: the flow list only. A tier on one list and not the other proves the surfaces are told apart.
5. Send one chat message without picking. The `Chat config resolved` log line carries `tier.id`, `surface` and the model id the turn ran on.
6. To see a re-point, change a `modelId` in the file, restart the backend (the catalog cache is in-process, 15 minutes) and reload the page (the web refetches every 15 minutes). Same label, new model in the log.

The Activepieces provider must be enabled for chat under Platform, AI, which needs `AP_EDITION=cloud` and `AP_OPENROUTER_PROVISION_KEY` on the dev box.
