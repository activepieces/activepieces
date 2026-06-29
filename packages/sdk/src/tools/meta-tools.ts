import { z, ZodRawShape } from 'zod'
import { ProjectSession } from '../session'
import { toolDescriptions } from './descriptions'

export function buildMetaTools(session: ProjectSession): SdkTool[] {
    return [
        {
            name: 'ap_research_pieces',
            description: toolDescriptions.research,
            inputSchema: {
                query: z.string().describe('What the user wants to do, e.g. "send a gmail email".'),
            },
            execute: async (args) => {
                const pieces = await session.pieces.list({ searchQuery: asString(args['query']) })
                return { pieces, count: pieces.length }
            },
        },
        {
            name: 'ap_get_piece_props',
            description: toolDescriptions.getProps,
            inputSchema: {
                pieceName: z.string().describe('Exact piece name from ap_research_pieces, e.g. "@activepieces/piece-gmail".'),
                actionName: z.string().describe('Action name, e.g. "send_email".'),
                connectionExternalId: z.string().optional().describe('Connection externalId to resolve dynamic options.'),
            },
            execute: async (args) => session.pieces.getProps({
                pieceName: asString(args['pieceName']),
                actionName: asString(args['actionName']),
                auth: optionalString(args['connectionExternalId']),
            }),
        },
        {
            name: 'ap_manage_connections',
            description: toolDescriptions.manageConnections,
            inputSchema: {
                pieceName: z.string().describe('Exact piece name from ap_research_pieces, e.g. "@activepieces/piece-gmail".'),
                externalId: z.string().optional().describe('Stable id to reuse for this connection.'),
            },
            execute: async (args) => {
                const pieceName = asString(args['pieceName'])
                const externalId = optionalString(args['externalId'])
                const existing = await session.connections.list({ pieceName, status: ['ACTIVE'] })
                const active = existing.find((connection) => externalId === undefined || connection.externalId === externalId)
                if (active !== undefined) {
                    return { status: 'CONNECTED', externalId: active.externalId, pieceName }
                }
                const link = await session.connections.createLink(pieceName, { externalId: externalId ?? `${pieceName}_connection` })
                return { status: 'PENDING', pieceName, externalId: link.externalId, redirectUrl: link.redirectUrl }
            },
        },
        {
            name: 'ap_run_action',
            description: toolDescriptions.runAction,
            inputSchema: {
                pieceName: z.string().describe('Exact piece name from ap_research_pieces, e.g. "@activepieces/piece-gmail".'),
                actionName: z.string().describe('Action name, e.g. "send_email".'),
                input: z.record(z.string(), z.unknown()).optional().describe('Schema-compliant input for the action.'),
                connectionExternalId: z.string().optional().describe('Connection externalId for the piece, from ap_manage_connections.'),
            },
            execute: async (args) => session.actions.run({
                pieceName: asString(args['pieceName']),
                actionName: asString(args['actionName']),
                props: asRecord(args['input']),
                connectionExternalId: optionalString(args['connectionExternalId']),
            }),
        },
    ]
}

function asString(value: unknown): string {
    return typeof value === 'string' ? value : ''
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
    return value !== null && typeof value === 'object' ? value as Record<string, unknown> : undefined
}

export type SdkTool = {
    name: string
    description: string
    inputSchema: ZodRawShape
    execute: (args: Record<string, unknown>) => Promise<unknown>
}
