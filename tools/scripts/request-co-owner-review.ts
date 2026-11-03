import { linearTicketCheck } from './linear-ticket-check'

const CO_OWNER_GROUP = 'Co-Owner'
const LOGIN_PATTERN = /\(@([\w-]+)\)\s*$/
const PAGE_SIZE = 100
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
    const reviewers = await fetchReviewers({ repository, prNumber, token })
    const logins = loginsToRequest({ coOwners, author, reviewers })
    if (logins.length === 0) {
        console.log(`Co-Owner ${coOwners.join(', ')} is the author or has already reviewed.`)
        return
    }
    await github({ path: `/repos/${repository}/pulls/${prNumber}/requested_reviewers`, token, method: 'POST', body: { reviewers: logins } })
    console.log(`✅ Requested a review from the Co-Owner: ${logins.join(', ')}`)
}

function requireEnv({ name }: { name: string }): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`${name} is not set.`)
    }
    return value
}

type ProjectLabel = { name: string, parent: { name: string } | null }

type LinearProjectLabelsResponse = {
    data?: { issues: { nodes: { project: { labels: { nodes: ProjectLabel[] } } | null }[] } }
    errors?: { message: string }[]
}

export const requestCoOwnerReview = { coOwnerLogins, loginsToRequest }

if (import.meta.main) {
    main().catch((error: unknown) => {
        console.error(`⚠️ Could not request the Co-Owner's review: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
    })
}
