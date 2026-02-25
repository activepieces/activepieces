import { McpServer, McpToolDefinition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { apAddCodeStepTool } from './ap-add-step'
import { apCreateFlowTool } from './ap-create-flow'
import { apFlowStructureTool } from './ap-flow-structure'
import { apListFlowsTool } from './ap-list-flows'

export const activepiecesTools = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition[] => [
    apCreateFlowTool(mcp, log),
    apAddCodeStepTool(mcp, log),
    apListFlowsTool(mcp, log),
    apFlowStructureTool(mcp, log),
]