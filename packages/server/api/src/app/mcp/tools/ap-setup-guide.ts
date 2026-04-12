import { PropertyType } from '@activepieces/pieces-framework'
import { AIProviderName, isNil, McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { aiProviderService } from '../../ai/ai-provider-service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { mcpUtils } from './mcp-utils'

const setupGuideInput = z.object({
    topic: z.enum(['connection', 'ai_provider']).describe('What to get setup instructions for'),
    pieceName: z.string().optional().describe('For connections: the piece that needs auth (e.g., "@activepieces/piece-gmail"). Omit for general instructions.'),
})

export const apSetupGuideTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_setup_guide',
        description: 'Get step-by-step instructions for setting up connections or AI providers. Use this when a piece needs authentication or when no AI providers are configured. Returns instructions for the user to follow in the UI — sensitive credentials are never handled through MCP.',
        inputSchema: setupGuideInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { topic, pieceName } = setupGuideInput.parse(args)

                if (topic === 'connection') {
                    return await connectionGuide(mcp, log, pieceName)
                }
                return await aiProviderGuide(mcp, log)
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_setup_guide failed')
                return mcpUtils.mcpToolError('Failed to generate setup guide', err)
            }
        },
    }
}

async function connectionGuide(mcp: McpServer, log: FastifyBaseLogger, pieceName?: string): Promise<{ content: [{ type: 'text', text: string }] }> {
    if (isNil(pieceName)) {
        return {
            content: [{
                type: 'text',
                text: [
                    'How to set up a connection:',
                    '',
                    '1. Open your Activepieces dashboard',
                    '2. Go to Settings → Connections',
                    '3. Click "+ New Connection"',
                    '4. Select the piece/app you want to connect',
                    '5. Follow the prompts (OAuth login, API key, etc.)',
                    '6. Save the connection',
                    '',
                    'Then use ap_list_connections to find the connection\'s externalId for use in flow steps.',
                    '',
                    'Tip: Pass pieceName to this tool for specific instructions (e.g., pieceName: "@activepieces/piece-gmail").',
                ].join('\n'),
            }],
        }
    }

    const piece = await pieceMetadataService(log).get({
        name: pieceName,
        version: undefined,
        projectId: mcp.projectId,
        platformId: undefined,
    })

    if (isNil(piece)) {
        return { content: [{ type: 'text', text: `❌ Piece "${pieceName}" not found. Use ap_list_pieces to find valid piece names.` }] }
    }

    const rawAuth = piece.auth
    if (isNil(rawAuth)) {
        return { content: [{ type: 'text', text: `✅ "${piece.displayName}" does not require authentication. No connection setup needed.` }] }
    }

    const authOptions = Array.isArray(rawAuth) ? rawAuth : [rawAuth]
    const auth = authOptions[0]
    const authType = auth.type
    const lines: string[] = [`How to connect "${piece.displayName}":`, '']
    if (authOptions.length > 1) {
        lines.push(`Note: This piece supports ${authOptions.length} authentication methods. Showing the primary one.`, '')
    }

    switch (authType) {
        case PropertyType.OAUTH2:
            lines.push(
                '1. Open your Activepieces dashboard',
                '2. Go to Settings → Connections → "+ New Connection"',
                `3. Select "${piece.displayName}"`,
                '4. Click "Connect" — an OAuth popup will open',
                '5. Log in and authorize access',
                '6. The connection will be saved automatically',
            )
            break
        case PropertyType.SECRET_TEXT:
            lines.push(
                '1. Open your Activepieces dashboard',
                '2. Go to Settings → Connections → "+ New Connection"',
                `3. Select "${piece.displayName}"`,
                `4. Enter your API key or token${'description' in auth && auth.description ? ` (${auth.description})` : ''}`,
                '5. Click Save',
            )
            break
        case PropertyType.BASIC_AUTH:
            lines.push(
                '1. Open your Activepieces dashboard',
                '2. Go to Settings → Connections → "+ New Connection"',
                `3. Select "${piece.displayName}"`,
                '4. Enter your username and password',
                '5. Click Save',
            )
            break
        case PropertyType.CUSTOM_AUTH: {
            const props = auth.props ?? {}
            const fieldNames = Object.entries(props).map(([key, prop]) => {
                const p = prop as { displayName?: string, required?: boolean }
                const req = p.required !== false ? ' (required)' : ' (optional)'
                return `  - ${p.displayName ?? key}${req}`
            })
            lines.push(
                '1. Open your Activepieces dashboard',
                '2. Go to Settings → Connections → "+ New Connection"',
                `3. Select "${piece.displayName}"`,
                '4. Fill in the following fields:',
                ...fieldNames,
                '5. Click Save',
            )
            break
        }
        default:
            lines.push(
                '1. Open your Activepieces dashboard',
                '2. Go to Settings → Connections → "+ New Connection"',
                `3. Select "${piece.displayName}"`,
                '4. Follow the prompts to complete the setup',
                '5. Click Save',
            )
    }

    lines.push('', 'After setup, use ap_list_connections to find the connection\'s externalId for use in flow steps.')

    return { content: [{ type: 'text', text: lines.join('\n') }] }
}

async function aiProviderGuide(mcp: McpServer, log: FastifyBaseLogger): Promise<{ content: [{ type: 'text', text: string }] }> {
    const project = await projectService(log).getOneOrThrow(mcp.projectId)
    const providers = await aiProviderService(log).listProviders(project.platformId)

    const lines: string[] = []

    if (providers.length > 0) {
        lines.push(
            `${providers.length} AI provider(s) already configured: ${providers.map(p => p.provider).join(', ')}`,
            '',
            'Use ap_list_ai_models to see available models.',
            '',
            'To add another provider:',
        )
    }
    else {
        lines.push('No AI providers configured yet.', '', 'How to add an AI provider:')
    }

    lines.push(
        '',
        '1. Open your Activepieces dashboard',
        '2. Go to Settings → AI Providers',
        '3. Click "+ Add Provider"',
        '4. Select a provider and enter your API key:',
        '',
        'Supported providers:',
        `  - ${AIProviderName.OPENAI} — requires API key from platform.openai.com`,
        `  - ${AIProviderName.ANTHROPIC} — requires API key from console.anthropic.com`,
        `  - ${AIProviderName.GOOGLE} — requires API key from aistudio.google.com`,
        `  - ${AIProviderName.AZURE} — requires API key + resource name`,
        `  - ${AIProviderName.OPENROUTER} — requires API key from openrouter.ai`,
        '',
        '5. Click Save',
        '',
        'After setup, use ap_list_ai_models to discover available models for Run Agent steps.',
    )

    return { content: [{ type: 'text', text: lines.join('\n') }] }
}
