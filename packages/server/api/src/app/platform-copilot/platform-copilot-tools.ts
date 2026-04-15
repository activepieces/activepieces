import { tool } from 'ai'
import { z } from 'zod'

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/activepieces/activepieces/main'
const GITHUB_BLOB_BASE = 'https://github.com/activepieces/activepieces/blob/main'

export function createCopilotTools({ platformId: _platformId }: { platformId: string }) {
    return {
        read_file: tool({
            description: `Read the COMPLETE content of a file from the Activepieces repository. Returns the full file — never truncated.

Key paths:
- docs/ — documentation (MDX/MD)
- packages/server/api/src/app/ — backend
- packages/shared/src/ — shared types
- packages/web/src/ — frontend
- packages/pieces/framework/src/ — piece framework`,
            inputSchema: z.object({
                filePath: z.string().describe('File path relative to repo root'),
            }),
            execute: async ({ filePath }) => {
                const url = `${GITHUB_RAW_BASE}/${filePath}`
                const res = await fetch(url)
                if (!res.ok) {
                    return { error: `File not found: ${filePath} (HTTP ${res.status})`, filePath, url: `${GITHUB_BLOB_BASE}/${filePath}` }
                }
                const content = await res.text()
                return { content, filePath, url: `${GITHUB_BLOB_BASE}/${filePath}`, lineCount: content.split('\n').length }
            },
        }),

        list_directory: tool({
            description: 'List files and directories at a given path in the Activepieces repository. Use to explore the repo structure when you need to find the right file.',
            inputSchema: z.object({
                dirPath: z.string().describe('Directory path relative to repo root, e.g. "docs/pieces" or "packages/server/api/src/app/flows"'),
            }),
            execute: async ({ dirPath }) => {
                const apiUrl = `https://api.github.com/repos/activepieces/activepieces/contents/${dirPath}?ref=main`
                const headers: Record<string, string> = { Accept: 'application/vnd.github+json' }
                const token = process.env['GITHUB_TOKEN']
                if (token) headers['Authorization'] = `Bearer ${token}`

                const res = await fetch(apiUrl, { headers })
                if (!res.ok) {
                    return { error: `Directory not found: ${dirPath} (HTTP ${res.status})` }
                }
                const items = await res.json() as { name: string, type: string, path: string }[]
                return {
                    entries: items.map(i => ({ name: i.name, type: i.type, path: i.path })),
                    count: items.length,
                }
            },
        }),
    }
}
