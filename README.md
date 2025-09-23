
<h1 align="center">
  AutomationX
</h1>

<h4 align="center">
  ActivePieces
</h4>

<p align="center">
<a href="/LICENSE" target="_blank"><img src='https://img.shields.io/badge/license-MIT-green?style=for-the-badge' /></a>&nbsp;<img src='https://img.shields.io/github/commit-activity/w/activepieces/activepieces/main?style=for-the-badge' />&nbsp;<a href='https://discord.gg/2jUXBKDdP8'><img src='https://img.shields.io/discord/966798490984382485?style=for-the-badge' /></a>
</p>

<p align="center">
  <a
    href="https://www.activepieces.com/docs"
    target="_blank"
  ><b>Documentation</b></a>&nbsp;&nbsp;&nbsp;🌪️&nbsp;&nbsp;&nbsp;
   <a
    href="https://www.activepieces.com/docs/developers/overview"
    target="_blank"
  ><b>Create a Piece</b></a>&nbsp;&nbsp;&nbsp;🖉&nbsp;&nbsp;&nbsp;
  <a
    href="https://www.activepieces.com/docs/install/overview"
    target="_blank"
  ><b>Deploy</b></a>&nbsp;&nbsp;&nbsp;🔥&nbsp;&nbsp;&nbsp;
  <a
    href="https://discord.gg/yvxF5k5AUb"
    target="_blank"
  >
    <b>Join Discord</b>
  </a>
</p>

<br>

# Introduction
AutomationX is a workflow management and execution platform built on top of ActivePieces. For more information, please refer their public repository [here](https://github.com/activepieces/activepieces)

## 🛠️  Builder Features:

- [x] Loops
- [x] Branches
- [x] Auto Retries
- [x] HTTP
- [x] Code with **NPM**
- [x] ASK AI in Code Piece (Non technical user can clean data without knowing to code)
- [x] Flows are fully versioned.
- [x] Languages Translations
- [x] Customizable Templates
- [X] 200+ Pieces, check https://www.activepieces.com/pieces


## 🔌 Create Your Own Piece

Activepieces supports integrations with Google Sheets, OpenAI, Discord, RSS, and over 200 other services. [Check out the full list of supported integrations](https://www.activepieces.com/pieces), which is constantly expanding thanks to our community's contributions.

As an **open ecosystem**, all integration source code is accessible in our repository. These integrations are versioned and [published](https://www.npmjs.com/search?q=%40activepieces) directly to npmjs.com upon contribution.

You can easily create your own integration using our TypeScript framework. For detailed instructions, please refer to our [Contributor's Guide](https://www.activepieces.com/docs/developers/building-pieces/overview).


# License

Activepieces' Community Edition is released as open source under the [MIT license](https://github.com/activepieces/activepieces/blob/main/LICENSE) and enterprise features are released under [Commercial License](https://github.com/activepieces/activepieces/blob/main/packages/ee/LICENSE)

AutomationX is built on top of the community edition of ActivePieces and the enterprise features have been removed to stay compliant to the dual licensing nature of ActivePieces

Read more about the feature comparison here https://www.activepieces.com/docs/about/editions

# Contribution
## Prerequisites
1. Ensure `nvm` is installed and exposed via OS path
2. Ensure `docker` and `docker compose` is installed and functional

## Development
- Clone this repository locally
- Go to project root and run `nvm use`
- Ensure the `.env` at `packages/server/api` applies to the database used for development (inferred via `AP_DB_TYPE`)
  - If `sqlite`, then no further configuration is needed
  - If `postgres`, ensure username and password is set correctly, refer `.env.example` in the same directory
- If `postgres`, then run the containers by `docker compose -f docker-compose.dev.yml up`
- Start the project using `npm run dev`
- Go to `http://localhost:4200` for the application UI

## Practices
- Repository uses commitlint to comply with proper commit message structures
- Ensure commit-able code is linted and formatted based on the respective config files (eslint, prettier)

## Utility Scripts

### Export to Markdown
- Export locally synced pieces as a markdown file named `pieces-extended.md`
- This file helps power the RAG pipeline for BotX (Support Documentation Chat)
- `node tools/piece-to-markdown.js`
- Ensure `frontend` and `backend` is running for AutomationX
