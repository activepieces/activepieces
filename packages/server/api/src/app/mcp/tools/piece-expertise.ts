import { mcpUtils } from './mcp-utils'

// Curated, high-signal expertise about OUR most-used pieces — the quirks a 5-year power user knows
// that the generic schema does NOT convey: which fields take IDs vs names, find-vs-list, unit/format
// traps, dynamic-schema gotchas. Surfaced JIT through ap_get_piece_props (never the always-on prompt)
// so the agent gets it exactly when it commits to an action. This is the curated half of the
// "generic-first, then curated top-N" strategy; grow it from real failures the eval harness catches
// (see scripts/expertise-from-thrash.mjs). Keyed by normalized piece short-name.
const EXPERTISE: Record<string, PieceExpertise> = {
    airtable: {
        general: 'base → table → fields are dynamic: fetch props WITH auth so they resolve. Linked-record fields take an ARRAY of record IDs (not names); attachment fields take {url} objects; single/multi-select take the option label exactly as defined in Airtable.',
        actions: {
            find_record: 'Finds ONE record by a field match. To list/enumerate records, use list_records — find_record with no/loose criteria returns nothing.',
        },
    },
    notion: {
        general: 'database properties are dynamic (fetch props with auth). Relation fields take page IDs, not titles; date fields need ISO-8601; the Title property is required and named per-database.',
    },
    hubspot: {
        general: 'object properties are dynamic and keyed by HubSpot internal API names (e.g. lifecyclestage, hs_lead_status), not the UI labels. Resolve props with auth and use the internal names.',
    },
    stripe: {
        general: 'amounts are in the currency\'s smallest unit. The Activepieces action takes a decimal amount (e.g. 42.50) and converts to cents for you — pass dollars, not cents. payment_method ids look like pm_…; customer ids like cus_….',
    },
    'google-sheets': {
        general: 'columns are addressed by LETTER (A, B, C…), not header name. Read a few rows first to map letters→meaning. The first matching sheet/spreadsheet is a dynamic dropdown — resolve with auth.',
    },
    slack: {
        general: 'channel is a dynamic dropdown resolving to a channel ID (Cxxxx), never the #name. Block Kit blocks are a structured array; the text field is the notification fallback.',
        actions: {
            send_message: 'channel must be the resolved ID from the dropdown, not "#general".',
        },
    },
    gmail: {
        general: 'recipients are plain email strings; attachments take file objects. Use the built-in reply actions to keep a draft in-thread rather than composing a fresh message.',
    },
    'google-calendar': {
        general: 'start/end are ISO-8601 datetimes; attendees is an array of email strings; calendar is a dynamic dropdown. Set create_meet_link to attach a Google Meet.',
    },
    telegram_bot: {
        general: 'chat_id is a numeric id or @channelusername. reply_markup is JSON following the Telegram inline-keyboard schema; format selects the parse mode (Markdown/HTML).',
    },
    trello: {
        general: 'board → list are dependent dynamic dropdowns (resolve board first). Labels are board-specific dynamic options; cards take the resolved list ID.',
    },
    http: {
        general: 'For send_request: headers/queryParams/authType are REQUIRED ({} / "NONE" when empty). body shape depends on body_type — json nests under a "data" key. Load the http_fallback guide for the full contract.',
    },
}

// Returns curated notes for a piece (and optionally a specific action), or undefined if none exist.
// Generic-first: the absence of a note is fine — the generic engine handles the long tail.
function getNotes({ pieceName, actionName }: { pieceName: string, actionName?: string }): string | undefined {
    const shortName = (mcpUtils.normalizePieceName(pieceName) ?? pieceName).replace('@activepieces/piece-', '')
    const entry = EXPERTISE[shortName]
    if (!entry) {
        return undefined
    }
    const actionNote = actionName ? entry.actions?.[actionName] : undefined
    return [entry.general, actionNote].filter((n): n is string => Boolean(n)).join(' ') || undefined
}

function hasNotes({ pieceName }: { pieceName: string }): boolean {
    const shortName = (mcpUtils.normalizePieceName(pieceName) ?? pieceName).replace('@activepieces/piece-', '')
    return Boolean(EXPERTISE[shortName])
}

export const pieceExpertise = {
    getNotes,
    hasNotes,
}

type PieceExpertise = {
    general?: string
    actions?: Record<string, string>
}
