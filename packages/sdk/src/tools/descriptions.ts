/**
 * Orchestration guidance lives in the tool descriptions (Composio-style), so it applies to
 * every agent framework without a separate system prompt.
 */
export const toolDescriptions = {
    research:
        'Discover Activepieces pieces and their actions for a task. ALWAYS call this first whenever the user mentions an app, service, or workflow — never guess piece or action names. Each result has an exact `name` (the full package id, e.g. "@activepieces/piece-gmail"). Pass that `name` verbatim to every other tool — never shorten it to a slug like "gmail".',
    getProps:
        'Load the input schema for a piece action before executing it. Use the exact piece `name` from ap_research_pieces (e.g. "@activepieces/piece-gmail"). Pass `connectionExternalId` to resolve dynamic dropdown options (e.g. Slack channels) for that account. Always call this before ap_run_action so you send schema-compliant arguments.',
    manageConnections:
        'Check whether a piece is connected and, if not, return a branded link the user opens to authenticate (OAuth, API key, or any auth type). Use the exact piece `name` from ap_research_pieces (e.g. "@activepieces/piece-gmail"). NEVER run an action without an ACTIVE connection. This tool never accepts secrets — the user enters credentials on the secure hosted page. After they finish, reuse the returned externalId.',
    runAction:
        'Execute a single piece action and return its output. Use the exact piece `name` from ap_research_pieces (e.g. "@activepieces/piece-gmail"). Only call after ap_research_pieces (discovery), ap_get_piece_props (schema), and an ACTIVE connection from ap_manage_connections. Pass strictly schema-compliant arguments.',
} as const
