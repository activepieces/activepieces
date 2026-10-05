import { FastifyBaseLogger } from 'fastify'

import { agentConfigRpc } from './rpc/agent-config-rpc'
import { conversationRpc } from './rpc/conversation-rpc'
import { emailRpc } from './rpc/email-rpc'
import { flowStepRpc } from './rpc/flow-step-rpc'
import { toolExecutionRpc } from './rpc/tool-execution-rpc'

export const agentRpcHandlers = (log: FastifyBaseLogger) => ({
    ...agentConfigRpc(log),
    ...conversationRpc(log),
    ...flowStepRpc(log),
    ...toolExecutionRpc(log),
    ...emailRpc(log),
})
