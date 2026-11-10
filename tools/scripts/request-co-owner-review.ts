import { linearTicketCheck } from './linear-ticket-check'

const CO_OWNER_GROUP = 'Co-Owner'
const LOGIN_PATTERN = /\(@([\w-]+)\)\s*$/
const PAGE_SIZE = 100
const PICK_WINDOW_MS = 5000
const TEAM_MEMBERS: Record<string, string[]> = {
    core: ['abuaboud', 'othmanemad', 'hazemadelkhalel', 'Louai-Zokerburg', 'AbdulTheActivePiecer', 'ziyadev', 'AhmadTash', 'lina-alomari', 'kareem834'],
    pieces: ['abuaboud', 'othmanemad', 'OdaiAhmed99', 'kishanprmr', 'ibrahim-abuznaid', 'AhmadTash', 'sanket-a11y', 'kareem834'],
    platform: ['abuaboud', 'othmanemad', 'amrdb', 'MrChaker', 'kareem834'],
}
const PROJECT_LABELS_QUERY = `query($team: String!, $number: Float!) {
    issues(includeArchived: true, filter: { team: { key: { eq: $team } }, number: { eq: $number } }) {
        nodes { project { labels { nodes { name parent { name } } } } }
    }
}`

function coOwnerLogins({ labels }: { labels: ProjectLabel[] }): string[] {
    const logins = labels
        .filter((label) => label.parent?.name === CO_OWNER_GROUP)
        .map((label) => LOGIN_PATTERN.exec(label.name)?.[1])
        .filter((login): login is string => login !== undefined)
    return [...new Set(logins)]
}

function loginsToRequest({ coOwners, author, reviewers }: { coOwners: string[], author: string, reviewers: string[] }): string[] {
    const skipped = new Set([author, ...reviewers].map((login) => login.toLowerCase()))
    return coOwners.filter((login) => !skipped.has(login.toLowerCase()))
}

function roundRobinPicks({ events, coOwners, teamMembers }: { events: TimelineEvent[], coOwners: string[], teamMembers: Record<string, string[]> }): string[] {
    const requests = events.filter((event) => event.event === 'review_requested')
    const teamRequests = requests.filter((event) => event.requested_team !== undefined)
    const coOwnerSet = new Set(coOwners.map((login) => login.toLowerCase()))
    const coOwnerInEveryTeam = teamRequests.every((event) => (teamMembers[event.requested_team?.slug ?? ''] ?? []).some((login) => coOwnerSet.has(login.toLowerCase())))
    if (!coOwnerInEveryTeam) {
        return []
    }
    const taken = new Set<number>()
    const picks = requests.flatMap((teamEvent, teamIndex) => {
        if (!teamEvent.requested_team) {
            return []
        }
        const pickIndex = requests.findIndex((event, index) =>
            index > teamIndex
            && !taken.has(index)
            && event.requested_reviewer !== undefined
            && Date.parse(event.created_at) - Date.parse(teamEvent.created_at) <= PICK_WINDOW_MS,
        )
        if (pickIndex === -1) {
            return []
        }
        taken.add(pickIndex)
        return [requests[pickIndex]]
    })
    const removable = picks.filter((pick) => {
        const login = pick.requested_reviewer?.login.toLowerCase() ?? ''
        const latest = requests.findLast((event) => event.requested_reviewer?.login.toLowerCase() === login)
        return !coOwnerSet.has(login) && latest === pick
    })
    return [...new Set(removable.map((pick) => pick.requested_reviewer?.login ?? ''))]
}

async function fetchProjectLabels({ id, apiKey }: { id: string, apiKey: string }): Promise<ProjectLabel[]> {
    const [team, number] = id.split('-')
    const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: PROJECT_LABELS_QUERY, variables: { team, number: Number(number) } }),
    })
    const result: LinearProjectLabelsResponse = await response.json()
    if (!response.ok || result.errors || !result.data) {
        throw new Error(`Linear API returned ${response.status}: ${result.errors?.[0]?.message ?? 'no data'}`)
    }
    return result.data.issues.nodes[0]?.project?.labels.nodes ?? []
}

async function github<T>({ path, token, method = 'GET', body }: { path: string, token: string, method?: string, body?: unknown }): Promise<T> {
    const response = await fetch(`https://api.github.com${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
        throw new Error(`GitHub API ${method} ${path} returned ${response.status}: ${await response.text()}`)
    }
    return response.json()
}

async function fetchReviewers({ repository, prNumber, token }: { repository: string, prNumber: string, token: string }): Promise<string[]> {
    const reviewers: string[] = []
    for (let page = 1; ; page++) {
        const reviews = await github<{ user: { login: string } | null }[]>({ path: `/repos/${repository}/pulls/${prNumber}/reviews?per_page=${PAGE_SIZE}&page=${page}`, token })
        reviewers.push(...reviews.flatMap((review) => review.user ? [review.user.login] : []))
        if (reviews.length < PAGE_SIZE) {
            return reviewers
        }
    }
}

async function fetchTimeline({ repository, prNumber, token }: { repository: string, prNumber: string, token: string }): Promise<TimelineEvent[]> {
    const events: TimelineEvent[] = []
    for (let page = 1; ; page++) {
        const batch = await github<TimelineEvent[]>({ path: `/repos/${repository}/issues/${prNumber}/timeline?per_page=${PAGE_SIZE}&page=${page}`, token })
        events.push(...batch)
        if (batch.length < PAGE_SIZE) {
            return events
        }
    }
}

async function removeRoundRobinPicks({ repository, prNumber, token, coOwners }: { repository: string, prNumber: string, token: string, coOwners: string[] }): Promise<void> {
    const [events, pending] = await Promise.all([
        fetchTimeline({ repository, prNumber, token }),
        github<{ users: { login: string }[] }>({ path: `/repos/${repository}/pulls/${prNumber}/requested_reviewers`, token }),
    ])
    const pendingLogins = new Set(pending.users.map((user) => user.login.toLowerCase()))
    const picks = roundRobinPicks({ events, coOwners, teamMembers: TEAM_MEMBERS }).filter((login) => pendingLogins.has(login.toLowerCase()))
    if (picks.length === 0) {
        console.log('No round-robin reviewer to remove: none is pending, or the Co-Owner is not in every requested team.')
        return
    }
    await github({ path: `/repos/${repository}/pulls/${prNumber}/requested_reviewers`, token, method: 'DELETE', body: { reviewers: picks } })
    console.log(`✅ Removed the round-robin reviewer: ${picks.join(', ')}`)
}

async function main(): Promise<void> {
    const apiKey = requireEnv({ name: 'LINEAR_API_KEY' })
    const token = requireEnv({ name: 'GITHUB_TOKEN' })
    const repository = requireEnv({ name: 'GITHUB_REPOSITORY' })
    const prNumber = requireEnv({ name: 'PR_NUMBER' })
    const author = requireEnv({ name: 'PR_AUTHOR' })
    const tickets = linearTicketCheck.findTickets({ body: process.env.PR_BODY ?? '' })
    const labels = (await Promise.all(tickets.map((id) => fetchProjectLabels({ id, apiKey })))).flat()
    const coOwners = coOwnerLogins({ labels })
    if (coOwners.length === 0) {
        console.log('No ticket of this PR is in a co-owned project.')
        return
    }
    if (coOwners.every((login) => login.toLowerCase() === author.toLowerCase())) {
        console.log(`Co-Owner ${coOwners.join(', ')} is the author, so the round-robin review stays.`)
        return
    }
    const reviewers = await fetchReviewers({ repository, prNumber, token })
    const logins = loginsToRequest({ coOwners, author, reviewers })
    if (logins.length > 0) {
        await github({ path: `/repos/${repository}/pulls/${prNumber}/requested_reviewers`, token, method: 'POST', body: { reviewers: logins } })
        console.log(`✅ Requested a review from the Co-Owner: ${logins.join(', ')}`)
    }
    await removeRoundRobinPicks({ repository, prNumber, token, coOwners })
}

function requireEnv({ name }: { name: string }): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`${name} is not set.`)
    }
    return value
}

type ProjectLabel = { name: string, parent: { name: string } | null }

type TimelineEvent = {
    event: string
    created_at: string
    requested_team?: { slug: string }
    requested_reviewer?: { login: string }
}

type LinearProjectLabelsResponse = {
    data?: { issues: { nodes: { project: { labels: { nodes: ProjectLabel[] } } | null }[] } }
    errors?: { message: string }[]
}

export const requestCoOwnerReview = { coOwnerLogins, loginsToRequest, roundRobinPicks }

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(`⚠️ The Co-Owner review step failed: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
    })
}
