import { StoreScope } from '@activepieces/pieces-framework'
import { McpToolDefinition, Permission, ProjectScopedMcpServer, STORE_KEY_MAX_LENGTH, STORE_VALUE_MAX_SIZE } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { storeEntryService } from '../../store-entry/store-entry.service'
import { mcpUtils } from './mcp-utils'
import sizeof from 'object-sizeof'

const scopeSchema = z.enum(['PROJECT', 'FLOW'])

const storeGetInput = z.object({
    key: z.string().max(STORE_KEY_MAX_LENGTH).describe('Store key'),
    scope: scopeSchema.describe('Storage scope'),
    flowId: z.string().optional().describe('Flow ID (required only for FLOW scope)'),
})

const storePutInput = z.object({
    key: z.string().max(STORE_KEY_MAX_LENGTH).describe('Store key'),
    value: z.any().describe('Value to store'),
    scope: scopeSchema.describe('Storage scope'),
    flowId: z.string().optional().describe('Flow ID (required only for FLOW scope)'),
})

const storeDeleteInput = z.object({
    key: z.string().max(STORE_KEY_MAX_LENGTH).describe('Store key'),
    scope: scopeSchema.describe('Storage scope'),
    flowId: z.string().optional().describe('Flow ID (required only for FLOW scope)'),
})

function createKey(scope: 'PROJECT' | 'FLOW', flowId: string | undefined, key: string): string {
    if (scope === 'FLOW') {
        if (!flowId) {
            throw new Error('flowId is required for FLOW scope')
        }
        return `flow_${flowId}/${key}`
    }
    return key
}

export const apStoreGetTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_get',
        permission: Permission.READ_FLOW, // Using flow read permission for store access
        description: 'Read a value by key from the persistent key-value store.',
        inputSchema: storeGetInput.shape,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, scope, flowId } = storeGetInput.parse(args)
                const modifiedKey = createKey(scope, flowId, key)
                const entry = await storeEntryService.getOne({
                    projectId: mcp.projectId,
                    key: modifiedKey,
                })
                return {
                    content: [{ type: 'text', text: entry ? JSON.stringify(entry.value, null, 2) : 'null' }],
                    structuredContent: { value: entry?.value ?? null },
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_get failed')
                return mcpUtils.mcpToolError('Failed to get store value', err)
            }
        },
    }
}

export const apStorePutTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_put',
        permission: Permission.WRITE_FLOW,
        description: 'Write or update a value in the persistent key-value store.',
        inputSchema: storePutInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, value, scope, flowId } = storePutInput.parse(args)
                const sizeOfValue = sizeof(value)
                if (sizeOfValue > STORE_VALUE_MAX_SIZE) {
                    return {
                        content: [{ type: 'text', text: `❌ Value too large (${sizeOfValue} bytes). Maximum allowed is ${STORE_VALUE_MAX_SIZE} bytes.` }],
                        isError: true,
                    }
                }
                const modifiedKey = createKey(scope, flowId, key)
                await storeEntryService.upsert({
                    projectId: mcp.projectId,
                    request: {
                        key: modifiedKey,
                        value,
                    },
                })
                return {
                    content: [{ type: 'text', text: `✅ Key "${key}" (${scope}) updated successfully.` }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_put failed')
                return mcpUtils.mcpToolError('Failed to put store value', err)
            }
        },
    }
}

export const apStoreDeleteTool = (mcp: ProjectScopedMcpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_store_delete',
        permission: Permission.WRITE_FLOW,
        description: 'Delete a key from the persistent key-value store.',
        inputSchema: storeDeleteInput.shape,
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { key, scope, flowId } = storeDeleteInput.parse(args)
                const modifiedKey = createKey(scope, flowId, key)
                await storeEntryService.delete({
                    projectId: mcp.projectId,
                    key: modifiedKey,
                })
                return {
                    content: [{ type: 'text', text: `✅ Key "${key}" (${scope}) deleted successfully.` }],
                }
            }
            catch (err) {
                log.error({ err, projectId: mcp.projectId }, 'ap_store_delete failed')
                return mcpUtils.mcpToolError('Failed to delete store value', err)
            }
        },
    }
}
