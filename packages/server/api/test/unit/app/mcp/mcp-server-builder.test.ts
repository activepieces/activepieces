import {
    apId,
    FlowOperationStatus,
    FlowStatus,
    FlowTriggerType,
    FlowVersionState,
    LATEST_FLOW_SCHEMA_VERSION,
    McpServerType,
    PopulatedFlow,
    PopulatedMcpServer,
} from '@activepieces/shared'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../../../src/app/webhooks/webhook.service', () => ({
    WebhookFlowVersionToRun: {
        LOCKED_FALL_BACK_TO_LATEST: 'LOCKED_FALL_BACK_TO_LATEST',
        LATEST: 'LATEST',
    },
    webhookService: { handleWebhook: vi.fn() },
}))

vi.mock('../../../../src/app/mcp/tools', () => ({
    activepiecesTools: () => [],
    LOCKED_TOOL_NAMES: [],
    ALL_CONTROLLABLE_TOOL_NAMES: [],
    PLATFORM_LEVEL_TOOL_NAMES: [],
}))

vi.mock('../../../../src/app/mcp/tools/ap-set-project-context', () => ({
    apSetProjectContextTool: vi.fn(),
}))

vi.mock('../../../../src/app/mcp/mcp-permissions', () => ({
    ALLOW_ALL: {
        check: () => null,
        wrapExecute: ({ execute }: { execute: unknown }) => execute,
    },
    resolvePermissionChecker: vi.fn(),
}))

vi.mock('../../../../src/app/mcp/mcp-project-selection', () => ({
    mcpProjectSelection: { get: vi.fn() },
}))

vi.mock('../../../../src/app/helper/telemetry.utils', () => ({
    telemetry: () => ({ trackProject: vi.fn() }),
}))

import { system } from '../../../../src/app/helper/system/system'
import { buildMcpServer } from '../../../../src/app/mcp/mcp-server-builder'

const log = system.globalLogger()
const NOW = '2026-01-01T00:00:00.000Z'

function createMcpToolFlow({ inputSchema }: { inputSchema: unknown }): PopulatedFlow {
    const flowId = apId()
    return {
        id: flowId,
        created: NOW,
        updated: NOW,
        projectId: apId(),
        status: FlowStatus.ENABLED,
        folderId: null,
        operationStatus: FlowOperationStatus.NONE,
        publishedVersionId: null,
        externalId: apId(),
        version: {
            id: apId(),
            created: NOW,
            updated: NOW,
            displayName: 'MCP Tool Flow',
            flowId,
            agentIds: [],
            connectionIds: [],
            state: FlowVersionState.LOCKED,
            valid: true,
            notes: [],
            schemaVersion: LATEST_FLOW_SCHEMA_VERSION,
            backupFiles: null,
            trigger: {
                type: FlowTriggerType.PIECE,
                name: 'trigger',
                valid: true,
                displayName: 'MCP Tool',
                lastUpdatedDate: NOW,
                settings: {
                    pieceName: '@activepieces/piece-mcp',
                    pieceVersion: '0.0.19',
                    triggerName: 'mcp_tool',
                    propertySettings: {},
                    input: {
                        toolName: 'my_tool',
                        toolDescription: 'test tool',
                        inputSchema,
                        returnsResponse: false,
                    },
                },
            },
        },
    }
}

function createMcpWithFlow({ inputSchema }: { inputSchema: unknown }): PopulatedMcpServer {
    const flow = createMcpToolFlow({ inputSchema })
    return {
        id: apId(),
        created: NOW,
        updated: NOW,
        platformId: null,
        projectId: flow.projectId,
        type: McpServerType.PROJECT,
        token: apId(),
        disabledTools: null,
        flows: [flow],
    }
}

describe('buildMcpServer — flow tool registration', () => {
    it('builds the server when a flow trigger has a corrupted non-array inputSchema', async () => {
        const mcp = createMcpWithFlow({ inputSchema: {} })
        await expect(buildMcpServer({ mcp, selectionScope: null, log })).resolves.toBeDefined()
    })

    it('builds the server for a valid inputSchema array', async () => {
        const mcp = createMcpWithFlow({
            inputSchema: [
                { name: 'title', type: 'text', required: true, description: '' },
            ],
        })
        await expect(buildMcpServer({ mcp, selectionScope: null, log })).resolves.toBeDefined()
    })
})
