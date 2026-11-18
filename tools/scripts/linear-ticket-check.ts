const TEAM_KEYS = ['ENG', 'AI', 'SRE', 'GIT', 'PIE']
const CLOSED_STATE_TYPES = ['canceled', 'duplicate']
const TICKET_PATTERN = new RegExp(`\\b(?:fixes|refs):?\\s+\\[?((?:${TEAM_KEYS.join('|')})-\\d+)\\b`, 'gi')
const ISSUE_QUERY = `query($team: String!, $number: Float!) {
    issues(includeArchived: true, filter: { team: { key: { eq: $team } }, number: { eq: $number } }) {
        nodes { state { type } }
    }
}`
const HOW_TO_FIX = [
    'How to fix: edit the PR description. Under "Linear ticket", write "Fixes ENG-123" on the last PR of the work, or "Refs ENG-123" on an earlier PR.',
    `Any team key works: ${TEAM_KEYS.join(', ')}. The check runs again when you save the description.`,
    'Community contributor? You need no Linear account and nothing to do. A maintainer adds a GIT or PIE ticket to your PR description, and the check runs again.',
].join('\n')

function findTickets({ body }: { body: string }): string[] {
    const visible = body.replace(/<!--[\s\S]*?-->/g, '')
    return [...new Set([...visible.matchAll(TICKET_PATTERN)].map((match) => match[1].toUpperCase()))]
}

function ticketProblem({ id, stateType }: { id: string, stateType: string | null }): string | null {
    if (stateType === null) {
        return `${id} does not exist in Linear.`
    }
    if (CLOSED_STATE_TYPES.includes(stateType)) {
        return `${id} is ${stateType}. Link the ticket that carries the work.`
    }
    return null
}

async function fetchStateType({ id, apiKey }: { id: string, apiKey: string }): Promise<string | null> {
    const [team, number] = id.split('-')
    const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: ISSUE_QUERY, variables: { team, number: Number(number) } }),
    })
    const result: LinearIssuesResponse = await response.json()
    if (!response.ok || result.errors || !result.data) {
        throw new Error(`Linear API returned ${response.status}: ${result.errors?.[0]?.message ?? 'no data'}`)
    }
    return result.data.issues.nodes[0]?.state.type ?? null
}

function fail({ problems }: { problems: string[] }): never {
    console.error('❌ Linear ticket check failed:\n')
    for (const problem of problems) {
        console.error(`   - ${problem}`)
    }
    console.error(`\n${HOW_TO_FIX}`)
    process.exit(1)
}

async function main(): Promise<void> {
    const tickets = findTickets({ body: process.env.PR_BODY ?? '' })
    if (tickets.length === 0) {
        fail({ problems: ['The PR description names no Linear ticket.'] })
    }
    const apiKey = process.env.LINEAR_API_KEY
    if (!apiKey) {
        console.error('❌ LINEAR_API_KEY is not set. A repo admin must add a read-only Linear API key as the LINEAR_API_KEY secret.')
        process.exit(1)
    }
    const stateTypes = await Promise.all(tickets.map((id) => fetchStateType({ id, apiKey })))
    const problems = tickets
        .map((id, index) => ticketProblem({ id, stateType: stateTypes[index] }))
        .filter((problem): problem is string => problem !== null)
    if (problems.length > 0) {
        fail({ problems })
    }
    console.log(`✅ Linear ticket check passed: ${tickets.join(', ')}`)
}

type LinearIssuesResponse = {
    data?: { issues: { nodes: { state: { type: string } }[] } }
    errors?: { message: string }[]
}

export const linearTicketCheck = { findTickets, ticketProblem }

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(`❌ Linear ticket check could not reach Linear: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
    })
}
