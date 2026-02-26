import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddStepTool } from './ap-add-step'
import { apCreateFlowTool } from './ap-create-flow'
import { apFlowStructureTool } from './ap-flow-structure'
import { apListFlowsTool } from './ap-list-flows'
import { apListPiecesTool } from './ap-list-pieces'
import { apDeleteStepTool } from './ap-delete-step'
import { apListConnectionsTool } from './ap-list-connections'

export const activepiecesTools = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition[] => [
    apCreateFlowTool(mcp, log),
    apAddStepTool(mcp, log),
    apDeleteStepTool(mcp, log),
    apListFlowsTool(mcp, log),
    apListConnectionsTool(mcp, log),
    apFlowStructureTool(mcp, log),
    apListPiecesTool(mcp, log),
]