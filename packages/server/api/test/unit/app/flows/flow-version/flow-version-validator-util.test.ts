import { Property } from '@activepieces/pieces-framework'
import { AgentPieceProps, AgentToolType, FlowActionType, FlowOperationRequest, FlowOperationType } from '@activepieces/shared'
import type { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({
        getOrThrow: async () => aiPiece,
    }),
}))

import { flowVersionValidationUtil } from '../../../../../src/app/flows/flow-version/flow-version-validator-util'

const aiPiece = {
    auth: undefined,
    actions: {
        run_agent: {
            requireAuth: false,
            props: {
                [AgentPieceProps.PROMPT]: Property.LongText({ displayName: 'Prompt', required: true }),
                [AgentPieceProps.AGENT_TOOLS]: Property.Array({
                    displayName: 'Tools',
                    required: false,
                    properties: {
                        type: Property.ShortText({ displayName: 'Tool Type', required: true }),
                        toolName: Property.ShortText({ displayName: 'Tool Name', required: true }),
                        pieceMetadata: Property.Json({ displayName: 'Piece Metadata', required: false }),
                        serverUrl: Property.ShortText({ displayName: 'MCP Server URL', required: false }),
                        protocol: Property.ShortText({ displayName: 'Protocol', required: false }),
                        auth: Property.Json({ displayName: 'Auth', required: false }),
                        sourceType: Property.ShortText({ displayName: 'Source Type', required: false }),
                        sourceId: Property.ShortText({ displayName: 'Source ID', required: false }),
                        sourceName: Property.ShortText({ displayName: 'Source Name', required: false }),
                    },
                }),
            },
        },
    },
}

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as unknown as FastifyBaseLogger

function pieceTool(pieceMetadata: Record<string, unknown>): Record<string, unknown> {
    return { type: AgentToolType.PIECE, toolName: 'HubSpot - Get Contact', pieceMetadata }
}

async function validityOf(agentTools: unknown[]): Promise<boolean> {
    const request: FlowOperationRequest = {
        type: FlowOperationType.ADD_ACTION,
        request: {
            parentStep: 'trigger',
            action: {
                name: 'step_1',
                type: FlowActionType.PIECE,
                displayName: 'Run Ops Agent',
                valid: true,
                settings: {
                    pieceName: '@activepieces/piece-ai',
                    pieceVersion: '0.4.7',
                    actionName: 'run_agent',
                    propertySettings: {},
                    input: { [AgentPieceProps.PROMPT]: 'hi', [AgentPieceProps.AGENT_TOOLS]: agentTools },
                },
            },
        },
    } as unknown as FlowOperationRequest

    const prepared = await flowVersionValidationUtil(log).prepareRequest({ platformId: 'plat1', request, userId: 'u1' })
    if (prepared.type !== FlowOperationType.ADD_ACTION) {
        throw new Error('unexpected operation type')
    }
    return prepared.request.action.valid
}

describe('flowVersionValidationUtil.prepareRequest — agent piece tools', () => {
    it('marks the step valid when every piece tool carries a pieceVersion', async () => {
        const valid = await validityOf([
            pieceTool({ pieceName: '@activepieces/piece-hubspot', pieceVersion: '0.8.7', actionName: 'get-contact' }),
        ])
        expect(valid).toBe(true)
    })

    it('marks the step invalid when a piece tool is missing pieceVersion', async () => {
        const valid = await validityOf([
            pieceTool({ pieceName: '@activepieces/piece-hubspot', actionName: 'get-contact' }),
        ])
        expect(valid).toBe(false)
    })

    it('ignores non-piece tools so knowledge-base and mcp tools never fail validation', async () => {
        const valid = await validityOf([
            { type: AgentToolType.KNOWLEDGE_BASE, toolName: 'KB', sourceType: 'FILE', sourceId: 'f1', sourceName: 'docs' },
            { type: AgentToolType.MCP, toolName: 'MCP', serverUrl: 'https://example.com', protocol: 'sse', auth: { type: 'none' } },
        ])
        expect(valid).toBe(true)
    })

    it('leaves steps without agent tools untouched', async () => {
        const valid = await validityOf([])
        expect(valid).toBe(true)
    })
})
