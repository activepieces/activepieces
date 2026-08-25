// Live failure-mode scenarios — real, business-phrased requests that exercise the
// most common pieces and the input shapes that trip the harness up (dynamic dropdowns,
// opaque JSON/Object bodies, dynamic table schemas, implicit unit/format semantics).
//
// These run against the dev backend with executeTools:true, so they hit real piece
// metadata and (where a connection exists) real execution. Prompts lead with business
// intent — never piece/action jargon — matching how a user actually talks to the agent.

const SCENARIOS: LiveScenario[] = [
    {
        id: 'slack-send-message',
        prompt: 'Post a quick "deploy finished ✅" note to our #general Slack channel.',
        targetPiece: 'slack',
        shape: 'dynamic-dropdown',
        expectsExecution: true,
        note: 'channel is a dynamic dropdown — agent cannot guess the id, must resolve with a live connection',
    },
    {
        id: 'gmail-send',
        prompt: 'Email ash@activepieces.com with the subject "Q4 numbers" and a one-line body saying the report is ready.',
        targetPiece: 'gmail',
        shape: 'well-specified',
        expectsExecution: true,
    },
    {
        id: 'gsheets-append-row',
        prompt: 'Add a row to my "Leads" spreadsheet: name Jane Doe, email jane@acme.com, status New.',
        targetPiece: 'google-sheets',
        shape: 'dynamic-dropdown',
        expectsExecution: true,
        note: 'spreadsheet + sheet are dynamic dropdowns; columns are letter-keyed, not header names',
    },
    {
        id: 'airtable-create-record',
        prompt: 'Create a new record in my Airtable CRM for the company "Acme Corp" with stage "Prospect".',
        targetPiece: 'airtable',
        shape: 'dynamic-schema',
        expectsExecution: true,
        note: 'base→table→fields are all dynamic; field types only knowable after a live schema fetch',
    },
    {
        id: 'notion-create-item',
        prompt: 'Add a task called "Follow up with Acme" to my Notion tasks database, due next Friday.',
        targetPiece: 'notion',
        shape: 'dynamic-schema',
        expectsExecution: true,
        note: 'database fields are dynamic; date needs ISO, relation fields need page ids',
    },
    {
        id: 'http-json-post',
        prompt: 'Send a POST request to https://httpbin.org/post with a JSON body {"event":"signup","plan":"pro"} and header X-Source: chat.',
        targetPiece: 'http',
        shape: 'opaque-json',
        expectsExecution: true,
        note: 'body/headers/queryParams are opaque Object/Json props with no sub-schema',
    },
    {
        id: 'openai-prompt',
        prompt: 'Use OpenAI to summarise this in one sentence: "Activepieces is an open-source workflow automation platform."',
        targetPiece: 'openai',
        shape: 'opaque-json',
        expectsExecution: true,
        note: 'roles is a Property.Json with no schema; model is a dynamic dropdown',
    },
    {
        id: 'discord-send',
        prompt: 'Drop a message in our Discord announcements channel: "Office closed Monday".',
        targetPiece: 'discord',
        shape: 'dynamic-dropdown',
        expectsExecution: true,
    },
    {
        id: 'telegram-send',
        prompt: 'Send a Telegram message to chat 12345678 saying "Backup completed".',
        targetPiece: 'telegram-bot',
        shape: 'well-specified',
        expectsExecution: true,
        note: 'reply_markup is JSON with the Telegram keyboard schema',
    },
    {
        id: 'hubspot-create-company',
        prompt: 'Create a company in HubSpot named "Acme Corp" with domain acme.com in the software industry.',
        targetPiece: 'hubspot',
        shape: 'dynamic-schema',
        expectsExecution: true,
        note: 'objectProperties are dynamic; property names are API ids (e.g. lifecyclestage)',
    },
    {
        id: 'stripe-payment-intent',
        prompt: 'Create a Stripe payment intent to charge $42.50 in USD.',
        targetPiece: 'stripe',
        shape: 'implicit-semantics',
        expectsExecution: true,
        note: 'amount is decimal dollars, silently *100 to cents — classic agent confusion',
    },
    {
        id: 'github-create-issue',
        prompt: 'Open a GitHub issue titled "Flaky test in chat eval" in my activepieces repo.',
        targetPiece: 'github',
        shape: 'dynamic-dropdown',
        expectsExecution: true,
    },
    {
        id: 'trello-create-card',
        prompt: 'Add a Trello card "Call the supplier" to my To Do list.',
        targetPiece: 'trello',
        shape: 'dynamic-dropdown',
        expectsExecution: true,
        note: 'board→list are dependent dynamic dropdowns',
    },
    {
        id: 'gcal-create-event',
        prompt: 'Put a 30-minute "Sync with Sam" meeting on my calendar tomorrow at 3pm.',
        targetPiece: 'google-calendar',
        shape: 'implicit-semantics',
        expectsExecution: true,
        note: 'datetime format implicit; calendar is a dynamic dropdown',
    },
    {
        id: 'gdrive-create-folder',
        prompt: 'Make a new Google Drive folder called "2026 Contracts".',
        targetPiece: 'google-drive',
        shape: 'well-specified',
        expectsExecution: true,
    },
    {
        id: 'multi-step-slack-from-sheet',
        prompt: 'Grab the email addresses from my "Leads" sheet and Slack me how many there are.',
        targetPiece: 'google-sheets',
        shape: 'multi-piece',
        expectsExecution: true,
        note: 'two pieces, dependent — read sheet then post to slack; tests context retention across hops',
    },
    {
        id: 'airtable-list-records',
        prompt: 'Show me all the companies in my Airtable CRM.',
        targetPiece: 'airtable',
        shape: 'dynamic-schema',
        expectsExecution: true,
        expectEnumerate: true,
        note: 'enumerate intent — the right instrument is list_records, NOT find_record (the exact Attio thrash, reproduced on a piece)',
    },
    {
        id: 'http-no-piece-api',
        prompt: 'Get the current Bitcoin price in USD from the CoinGecko public API.',
        shape: 'native-http',
        expectsExecution: true,
        native: 'http',
        note: 'no piece exists — mastery means reaching the API directly over HTTP',
    },
    {
        id: 'code-transform',
        prompt: 'Make me a CSV of the numbers 1 through 100 alongside their squares.',
        shape: 'native-code',
        expectsExecution: true,
        native: 'code',
        note: 'pure transform — mastery means writing and running code, not hunting for a piece',
    },
]

export const liveScenarios = {
    all: (): LiveScenario[] => SCENARIOS,
    byId: (id: string): LiveScenario | undefined => SCENARIOS.find((s) => s.id === id),
}

// The input shape the scenario is built to stress — used to group results so we can see
// which kinds of inputs the harness handles well vs. poorly.
export type LiveScenarioShape =
    | 'well-specified'
    | 'dynamic-dropdown'
    | 'dynamic-schema'
    | 'opaque-json'
    | 'implicit-semantics'
    | 'multi-piece'
    | 'native-http'
    | 'native-code'

export type LiveScenario = {
    id: string
    prompt: string
    targetPiece?: string
    shape: LiveScenarioShape
    expectsExecution: boolean
    // The right instrument is an enumerate action (list_*/search_*), not a find-one — graded as
    // "wrong instrument" if the agent only reached for find_*/get_* (the Attio thrash signature).
    expectEnumerate?: boolean
    // A native-capability task with no piece: mastery = reaching the API over HTTP, or writing code.
    native?: 'http' | 'code'
    note?: string
}
