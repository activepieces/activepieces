# Activepieces Brave Search Piece (MCP)

This project contains the source code for the **Brave Search** integration for Activepieces.
Activepieces automatically exposes this integration as an MCP (Model Context Protocol) server, allowing agents to use Brave Search.

## Integration Details

- **Name**: Brave Search
- **Description**: Privacy-focused web search engine.
- **Auth**: API Key (Brave Search API)
- **Actions**:
  - `web_search`: Perform a web search query.

## Development Status

- [x] Scaffolding
- [ ] Implementation of `web_search` action
- [ ] Testing

## How to use

This code is designed to be dropped into the `packages/pieces/community/brave-search` directory of the Activepieces repository.

1. Clone Activepieces: `git clone https://github.com/activepieces/activepieces.git`
2. Copy this folder to `packages/pieces/community/brave-search`
3. Run `npm install` in the root.
4. Build the piece: `nx build piece-brave-search`
5. Run Activepieces locally to test.
