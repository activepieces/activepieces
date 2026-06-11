import { readFileSync } from 'node:fs'
import path from 'node:path'
import { McpToolDefinition, McpToolResult } from '@activepieces/shared'
import { z } from 'zod'
import { mcpUtils } from './mcp-utils'

const GUIDES_DIR = 'packages/server/api/src/assets/mcp-guides'

const GUIDE_FILES: Record<GuideTopic, string> = {
    'flow-building': 'flow-building.md',
    patterns: 'patterns.md',
    'control-flow': 'control-flow.md',
    state: 'state.md',
    tables: 'tables.md',
    ai: 'ai.md',
    'error-handling': 'error-handling.md',
}

const getGuideInput = z.object({
    topic: z.enum(['flow-building', 'patterns', 'control-flow', 'state', 'tables', 'ai', 'error-handling']).describe([
        'Which guide to read:',
        '- flow-building: the build loop, native built-in pieces, step references, auth, naming, validate/test discipline, hard limits. Read this first.',
        '- patterns: recurring flow archetypes (passthrough, classify-then-route, lookup-or-create, enrichment, fan-out, …) so you build the right shape.',
        '- control-flow: routers and loops — branch indexing, the zombie-branch gotcha, loop output shape, sequential execution.',
        '- state: choosing Store vs Tables vs Sheets, scopes, idempotency gates, and dedup.',
        '- tables: the built-in Tables database — tools, field types, filters, gotchas.',
        '- ai: native AI actions (ask, classify, extract, summarize, agent) and their output shapes.',
        '- error-handling: failure modes, retries, on-success/on-failure branches, the HTTP shape-change trap, dead-letter, decomposition.',
    ].join('\n')),
})

export const apGetGuideTool = (): McpToolDefinition => ({
    title: 'ap_get_guide',
    description: 'Read an in-depth Activepieces how-to guide before building, or when unsure how a feature behaves. Returns battle-tested patterns and the gotchas that actually break flows. Topics: flow-building (read first), patterns, control-flow, state, tables, ai, error-handling.',
    inputSchema: getGuideInput.shape,
    annotations: { readOnlyHint: true, openWorldHint: false },
    execute: async (args): Promise<McpToolResult> => {
        try {
            const { topic } = getGuideInput.parse(args)
            const text = readFileSync(path.resolve(`${GUIDES_DIR}/${GUIDE_FILES[topic]}`), 'utf8')
            return { content: [{ type: 'text', text }] }
        }
        catch (err) {
            return mcpUtils.mcpToolError('Failed to load the requested guide', err)
        }
    },
})

type GuideTopic = 'flow-building' | 'patterns' | 'control-flow' | 'state' | 'tables' | 'ai' | 'error-handling'
