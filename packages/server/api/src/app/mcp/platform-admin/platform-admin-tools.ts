import { readFileSync } from 'node:fs'
import path from 'node:path'
import { isNil, isObject, tryCatchSync } from '@activepieces/core-utils'
import { McpToolDefinition, McpToolResult } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { mcpUtils } from '../tools/mcp-utils'
import { platformAdminApi, PlatformAdminCallParams } from './platform-admin-api'

export function platformAdminTools({ userId, log }: { userId: string, log: FastifyBaseLogger }): McpToolDefinition[] {
    return [
        {
            title: PLATFORM_GUIDE_TOOL_NAME,
            description: 'Explain the platform admin pages. Without a page, lists every admin page. With a page, returns its documentation and the endpoints behind it with their request schemas. Read this before calling ap_platform_read or ap_platform_write.',
            inputSchema: guideInput.shape,
            annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
            execute: async (args): Promise<McpToolResult> => {
                const { page } = guideInput.parse(args)
                return textResult(isNil(page) ? renderPageIndex() : renderPage(page))
            },
        },
        {
            title: PLATFORM_READ_TOOL_NAME,
            description: 'Read platform admin data by calling a GET endpoint listed by ap_platform_guide, as the current user.',
            inputSchema: readInput.shape,
            annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
            execute: async (args): Promise<McpToolResult> => {
                const { path: requestPath, query } = readInput.parse(args)
                return callEndpoint({ userId, method: 'GET', path: requestPath, query, log })
            },
        },
        {
            title: PLATFORM_WRITE_TOOL_NAME,
            description: 'Change a platform admin setting by calling a POST or DELETE endpoint listed by ap_platform_guide, as the current user. Changes take effect immediately for the whole platform.',
            inputSchema: writeInput.shape,
            annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
            execute: async (args): Promise<McpToolResult> => {
                const { method, path: requestPath, query, body } = writeInput.parse(args)
                return callEndpoint({ userId, method, path: requestPath, query, body, log })
            },
        },
    ]
}

function readPlatformDoc(doc: string): PlatformDoc {
    const cached = docCache.get(doc)
    if (!isNil(cached)) {
        return cached
    }
    const raw = readFileSync(path.resolve(DOCS_ROOT, `${doc}.mdx`), 'utf8')
    const frontmatter = raw.match(FRONTMATTER)?.[1] ?? ''
    const parsed: PlatformDoc = {
        title: frontmatterField({ frontmatter, key: 'title' }) ?? doc,
        description: frontmatterField({ frontmatter, key: 'description' }) ?? '',
        body: raw.replace(FRONTMATTER, '')
            .replace(/^import .*$/gm, '')
            .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
            .replace(PAGE_TAG, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim(),
    }
    docCache.set(doc, parsed)
    return parsed
}

async function callEndpoint(params: PlatformAdminCallParams): Promise<McpToolResult> {
    const result = await platformAdminApi.call(params)
    const route = platformAdminApi.exposedRoutes().find(({ method, url }) => method === params.method && url === result.route)
    const schemaHint = result.statusCode === 400 && !isNil(route)
        ? `\n\nFix the request to match this schema and retry once:\n${JSON.stringify(route.schema)}`
        : ''
    const body = isNil(route) ? result.body : redact({ body: result.body, paths: route.redact })
    const text = `HTTP ${result.statusCode}\n${mcpUtils.truncate(body, MAX_RESPONSE_CHARS)}${schemaHint}`
    return { content: [{ type: 'text', text }], ...(result.statusCode >= 400 ? { isError: true } : {}) }
}

function redact({ body, paths }: { body: string, paths: string[] }): string {
    if (paths.length === 0) {
        return body
    }
    const { data: parsed, error } = tryCatchSync((): unknown => JSON.parse(body))
    if (error) {
        return body
    }
    return JSON.stringify(paths.reduce((value, dotPath) => withoutPath({ value, keys: dotPath.split('.') }), parsed))
}

function withoutPath({ value, keys }: { value: unknown, keys: string[] }): unknown {
    const [key, ...rest] = keys
    if (!isObject(value) || isNil(key) || !(key in value)) {
        return value
    }
    if (rest.length === 0) {
        return Object.fromEntries(Object.entries(value).filter(([name]) => name !== key))
    }
    return { ...value, [key]: withoutPath({ value: value[key], keys: rest }) }
}

function renderPageIndex(): string {
    const lines = pageDocs().map((doc) => {
        const { title, description } = readPlatformDoc(doc)
        return `- ${doc}: ${title}. ${description}`
    })
    return ['Platform admin pages. Call ap_platform_guide with one of these as `page`:', ...lines].join('\n')
}

function renderPage(page: string): string {
    if (!pageDocs().includes(page)) {
        return `Unknown page "${page}". Call ap_platform_guide without a page to list them.`
    }
    const { title, body } = readPlatformDoc(page)
    const endpoints = platformAdminApi.exposedRoutes()
        .filter((route) => route.doc === page)
        .map((route) => `- ${route.method} ${route.url} ${JSON.stringify(route.schema)}`)
    return [`# ${title}`, body, '## Endpoints', 'Path parameters such as :id are replaced with real values. Files cannot be uploaded.', ...endpoints].join('\n\n')
}

function pageDocs(): string[] {
    return [...new Set(platformAdminApi.exposedRoutes().map((route) => route.doc))].sort()
}

function frontmatterField({ frontmatter, key }: { frontmatter: string, key: string }): string | undefined {
    return frontmatter.match(new RegExp(`^${key}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1]
}

function textResult(text: string): McpToolResult {
    return { content: [{ type: 'text', text }] }
}

const DOCS_ROOT = 'docs'
const docCache = new Map<string, PlatformDoc>()
const FRONTMATTER = /^---\n([\s\S]*?)\n---\n/
const PAGE_TAG = /<\/?(?:[A-Z][\w.]*|video|iframe|img|br|u|div|span)\b[^>]*>/g
const MAX_RESPONSE_CHARS = 20_000
const ADMIN_PATH = /^\/api\/v1(\/(?:[A-Za-z0-9_-]|%(?!2[EeFf]|5[Cc])[0-9A-Fa-f]{2})+)+$/

const guideInput = z.object({
    page: z.string().optional().describe('A page from the list returned without a page, e.g. "admin-guide/guides/sso"'),
})

const readInput = z.object({
    path: z.string().regex(ADMIN_PATH).describe('Endpoint path with parameters filled in and URL-encoded, e.g. /api/v1/api-keys or /api/v1/project-roles/Run%20viewer'),
    query: z.record(z.string(), z.string()).optional(),
})

const writeInput = readInput.extend({
    method: z.enum(['POST', 'DELETE']),
    body: z.record(z.string(), z.unknown()).optional().describe('JSON body matching the endpoint schema from ap_platform_guide'),
})

const PLATFORM_GUIDE_TOOL_NAME = 'ap_platform_guide'
const PLATFORM_READ_TOOL_NAME = 'ap_platform_read'
export const PLATFORM_WRITE_TOOL_NAME = 'ap_platform_write'

type PlatformDoc = {
    title: string
    description: string
    body: string
}
