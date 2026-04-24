import { tool } from 'ai'
import { z } from 'zod'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const JINA_SEARCH = 'https://s.jina.ai'
const JINA_READ = 'https://r.jina.ai'
const GITHUB_API = 'https://api.github.com'
const GITHUB_RAW = 'https://raw.githubusercontent.com/activepieces/activepieces/main'
const GITHUB_BLOB = 'https://github.com/activepieces/activepieces/blob/main'
const REPO = 'activepieces/activepieces'

const READ_TRUNCATE_CHARS = 30000
const RESEARCH_CONTENT_PER_SOURCE = 6000
const RESEARCH_MAX_SOURCES = 5
const SEARCH_RESULT_LIMIT = 10
const CODE_SEARCH_LIMIT = 10

export function createCopilotTools() {
    return {
        research: tool({
            description: 'Deep research on any Activepieces topic. Runs up to three parallel web searches, fetches the top results as clean markdown, and returns the combined content. This is your PRIMARY tool — use it first for any question about Activepieces product, pricing, plans, features, docs, how-tos, or integrations. You get back full page content ready to read, not just snippets. Good query mix: ["activepieces pricing plans", "site:activepieces.com pricing", "site:activepieces.com/docs getting started"].',
            inputSchema: z.object({
                queries: z.array(z.string()).min(1).max(3).describe('One to three search queries covering the topic from different angles. Mix broad queries with site-scoped ones (site:activepieces.com/docs, site:activepieces.com) to maximize coverage.'),
            }),
            execute: async ({ queries }) => {
                const searchPerQuery = await Promise.all(queries.map((q) => runJinaSearch(q)))
                const seenUrls = new Set<string>()
                const ranked: JinaHit[] = []
                searchPerQuery.forEach((hits, idx) => {
                    for (const hit of hits) {
                        if (seenUrls.has(hit.url)) continue
                        seenUrls.add(hit.url)
                        ranked.push({ ...hit, query: queries[idx] })
                    }
                })

                const withContent = ranked.filter((hit) => hit.content.length > 0)
                const sources = withContent.slice(0, RESEARCH_MAX_SOURCES).map((hit) => ({
                    title: hit.title,
                    url: hit.url,
                    query: hit.query,
                    content: truncate(hit.content, RESEARCH_CONTENT_PER_SOURCE),
                }))

                if (sources.length === 0) {
                    return {
                        queries,
                        error: 'No search results returned page content. Try again with different query phrasings (more specific, different keywords, or add site: qualifiers).',
                        urlsOnly: ranked.slice(0, 10).map((h) => ({ title: h.title, url: h.url, snippet: h.snippet })),
                    }
                }


                console.log('******* RESEARCH ************')
                console.log({
                    queries,
                    totalHits: ranked.length,
                    sources,
                    otherHits: ranked.slice(sources.length, sources.length + 5).map((h) => ({ title: h.title, url: h.url, snippet: h.snippet })),
                })
                console.log('******* RESEARCH ************')

                return {
                    queries,
                    totalHits: ranked.length,
                    sources,
                    otherHits: ranked.slice(sources.length, sources.length + 5).map((h) => ({ title: h.title, url: h.url, snippet: h.snippet })),
                }
            },
        }),

        read_url: tool({
            description: 'Fetch a single URL and return its full clean markdown content. Use this to drill deeper into a specific page surfaced by `research` that you want to read in full, or to pull a specific URL a user provided.',
            inputSchema: z.object({
                url: z.string().describe('Full https:// URL to fetch.'),
            }),
            execute: async ({ url }) => {
                const result = await fetchJinaReader(url)
                if (!result.ok) {
                    return { error: result.error, url }
                }
                const { text, truncated } = truncateWithFlag(result.text, READ_TRUNCATE_CHARS)

                console.log('******* READ URL ************')
                console.log( { url, content: text, truncated })
                console.log('******* READ URL ************')

                return { url, content: text, truncated }
            },
        }),

        search_github_code: tool({
            description: `Search code inside the Activepieces GitHub repo (${REPO}). Use for implementation questions ("how does X work under the hood", "where is Y defined"). Returns file paths with matching line snippets. Requires GITHUB_TOKEN on the server.`,
            inputSchema: z.object({
                query: z.string().describe('Code search query. Can use GitHub qualifiers like extension:ts, path:packages/server.'),
            }),
            execute: async ({ query }) => {
                const q = `${query} repo:${REPO}`
                const url = `${GITHUB_API}/search/code?q=${encodeURIComponent(q)}&per_page=${CODE_SEARCH_LIMIT}`
                const headers: Record<string, string> = {
                    'Accept': 'application/vnd.github.text-match+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                }
                const token = system.getOrThrow(AppSystemProp.GITHUB_TOKEN)
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await safeFetch(url, { headers })
                if (!res.ok) {
                    return { error: `Code search failed (HTTP ${res.status}). ${token ? '' : 'Hint: GITHUB_TOKEN is not set.'}`, query }
                }
                const json = res.json as GithubCodeSearchResponse
                const items = (json?.items ?? []).slice(0, CODE_SEARCH_LIMIT).map((item) => ({
                    path: item.path,
                    url: `${GITHUB_BLOB}/${item.path}`,
                    fragments: (item.text_matches ?? []).map((m) => truncate(m.fragment, 300)),
                }))
                console.log('******* SEARCH GITGUB CODE ************')
                console.log({ query, total: json?.total_count ?? items.length, items })
                console.log('******* SEARCH GITGUB CODE ************')
                return { query, total: json?.total_count ?? items.length, items }
            },
        }),

        read_github_file: tool({
            description: 'Read the COMPLETE content of a file from the Activepieces repo. Use after `search_github_code` identifies a relevant file. Path is relative to repo root.',
            inputSchema: z.object({
                filePath: z.string().describe('Repo-relative path, e.g. "packages/server/api/src/app/app.ts".'),
            }),
            execute: async ({ filePath }) => {
                const url = `${GITHUB_RAW}/${filePath}`
                const res = await safeFetch(url)
                if (!res.ok) {
                    return { error: `File not found: ${filePath} (HTTP ${res.status})`, filePath, url: `${GITHUB_BLOB}/${filePath}` }
                }
                const { text, truncated } = truncateWithFlag(res.text ?? '', READ_TRUNCATE_CHARS)

                console.log('******* READ GITGUB FILE ************')
                console.log({ filePath, url: `${GITHUB_BLOB}/${filePath}`, content: text, lineCount: (res.text ?? '').split('\n').length, truncated })
                console.log('******* READ GITGUB FILE ************')

                return { filePath, url: `${GITHUB_BLOB}/${filePath}`, content: text, lineCount: (res.text ?? '').split('\n').length, truncated }
            },
        }),

        list_github_directory: tool({
            description: 'List files/subdirectories at a path in the Activepieces repo. Use to explore structure when you do not know the file path.',
            inputSchema: z.object({
                dirPath: z.string().describe('Repo-relative directory path.'),
            }),
            execute: async ({ dirPath }) => {
                const url = `${GITHUB_API}/repos/${REPO}/contents/${dirPath}?ref=main`
                const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
                const token = system.getOrThrow(AppSystemProp.GITHUB_TOKEN)
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await safeFetch(url, { headers })
                if (!res.ok) {
                    return { error: `Directory not found: ${dirPath} (HTTP ${res.status})`, dirPath }
                }
                const items = (res.json as GithubContentEntry[]) ?? []

                console.log('******* LIST GITGUB DIRECTORy ************')
                console.log({
                    dirPath,
                    entries: items.map((i) => ({ name: i.name, type: i.type, path: i.path })),
                    count: items.length,
                })
                console.log('******* LIST GITGUB DIRECTORy ************')
                return {
                    dirPath,
                    entries: items.map((i) => ({ name: i.name, type: i.type, path: i.path })),
                    count: items.length,
                }
            },
        }),
    }
}

async function runJinaSearch(query: string): Promise<JinaHit[]> {
    const url = `${JINA_SEARCH}/${encodeURIComponent(query)}`
    const headers: Record<string, string> = { Accept: 'application/json' }
    const jinaKey = system.getOrThrow(AppSystemProp.JINA_API_KEY)
    if (jinaKey) headers['Authorization'] = `Bearer ${jinaKey}`

    const res = await safeFetch(url, { headers })


    console.log('####################### RUN JINA SEARCH #############################3')
    console.log(res)
    console.log('#######################################################3')


    if (!res.ok) return []
    const json = res.json as JinaSearchResponse
    return (json?.data ?? []).slice(0, SEARCH_RESULT_LIMIT).map((r) => ({
        title: r.title ?? r.url,
        url: r.url,
        snippet: truncate(r.description ?? '', 500),
        content: r.content ?? '',
        query: '',
    }))
}

async function fetchJinaReader(url: string): Promise<JinaReadResult> {
    const target = `${JINA_READ}/${url}`
    const headers: Record<string, string> = { Accept: 'text/markdown' }
    const jinaKey = system.getOrThrow(AppSystemProp.JINA_API_KEY)
    if (jinaKey) headers['Authorization'] = `Bearer ${jinaKey}`

    const res = await safeFetch(target, { headers })

    console.log('####################### FETCH JINA READER #############################3')
    console.log(res)
    console.log('#######################################################3')

    if (!res.ok) {
        return { ok: false, error: `Failed to read URL (HTTP ${res.status})` }
    }
    return { ok: true, text: res.text ?? '' }
}

async function safeFetch(url: string, init?: RequestInit): Promise<SafeFetchResult> {
    try {
        const res = await fetch(url, init)
        const contentType = res.headers.get('content-type') ?? ''
        if (contentType.includes('application/json')) {
            const json = await res.json() as unknown
            return { ok: res.ok, status: res.status, json }
        }
        const text = await res.text()
        return { ok: res.ok, status: res.status, text }
    }
    catch (err) {
        return { ok: false, status: 0, text: err instanceof Error ? err.message : String(err) }
    }
}

function truncate(input: string, max: number): string {
    if (input.length <= max) return input
    return input.slice(0, max) + '…'
}

function truncateWithFlag(input: string, max: number): { text: string, truncated: boolean } {
    if (input.length <= max) return { text: input, truncated: false }
    return { text: input.slice(0, max) + '\n\n[truncated]', truncated: true }
}

type SafeFetchResult = {
    ok: boolean
    status: number
    json?: unknown
    text?: string
}

type JinaHit = {
    title: string
    url: string
    snippet: string
    content: string
    query: string
}

type JinaReadResult =
    | { ok: true, text: string }
    | { ok: false, error: string }

type JinaSearchResponse = {
    data?: { title?: string, url: string, content?: string, description?: string }[]
}

type GithubCodeSearchResponse = {
    total_count?: number
    items?: { path: string, html_url: string, text_matches?: { fragment: string }[] }[]
}

type GithubContentEntry = {
    name: string
    type: string
    path: string
}
