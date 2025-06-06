import { Agent, RESOLVED_STATUS, TodoEnvironment } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { todoService } from '../todos/todo.service'
import { streamText, ToolExecutionOptions, ToolSet } from 'ai';
import { createOpenAI, openai } from '@ai-sdk/openai'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { todoActivitiesService } from '../todos/activity/todos-activity.service'
import { Socket } from 'socket.io'
import { todoSideEfffects } from '../todos/todo-side-effects'
import { experimental_createMCPClient } from "ai"
import { mcpService } from '../mcp/mcp-service';
import { domainHelper } from '../ee/custom-domains/domain-helper';
import { accessTokenManager } from '../authentication/lib/access-token-manager';

export const agentExecutor = (log: FastifyBaseLogger) => ({
    execute: async (params: ExecuteAgent) => {
        const { agent } = params
        const todo = await todoService(log).create({
            description: params.prompt,
            title: 'Agent Test Todo',
            statusOptions: [{
                name: RESOLVED_STATUS.name,
                description: RESOLVED_STATUS.description,
                variant: RESOLVED_STATUS.variant,
                continueFlow: true,
            }],
            createdByUserId: params.userId,
            platformId: agent.platformId,
            projectId: agent.projectId,
            flowId: undefined,
            locked: true,
            runId: undefined,
            agentId: agent.id,
            environment: TodoEnvironment.TEST,
        })

        rejectedPromiseHandler(executeAgent(params, todo.id, log), log)
        return todo
    },
})

async function executeAgent(params: ExecuteAgent, todoId: string, log: FastifyBaseLogger) {
    let comment = await createEmptyComment(params, todoId, log)
    let currentComment = ''
    log.info({
        agentId: params.agent.id,
        mcpId: params.agent.mcpId,
    }, 'Starting agent execution')
    const mcpServer = await mcpService(log).getMcpServerUrl({ mcpId: params.agent.mcpId })
    const mcpClient = await experimental_createMCPClient({
        transport: {
            type: 'sse',
            url: mcpServer,
        },
    });
    const tools = await mcpClient.tools();
    const baseUrl = await domainHelper.getPublicApiUrl({
        path: '/v1/ai-providers/proxy/openai/v1/',
        platformId: params.agent.platformId,
    })
    const { fullStream } = await streamText({
        model: createOpenAI({
            baseURL: baseUrl,
            apiKey: await accessTokenManager.generateEngineToken({
                platformId: params.agent.platformId,
                projectId: params.agent.projectId,
            }),
        }).chat('gpt-4o'),

        system: params.agent.systemPrompt,
        prompt: params.prompt,
        maxSteps: params.agent.maxSteps,
        tools,
    })
    for await (const chunk of fullStream) {
        if (chunk.type === 'text-delta') {
            currentComment += chunk.textDelta
        }

        else if (chunk.type === 'tool-call') {
            currentComment += `<tool-call id="${chunk.toolCallId}">${JSON.stringify({
                toolName: chunk.toolName,
                result: chunk.args,
            })}</tool-call>`
        } else if (chunk.type === 'tool-result') {
            const textResult = 'Hello'
            currentComment += `<tool-result id="${chunk.toolCallId}">${JSON.stringify({
                result: textResult,
            })}</tool-result>`
        }
        todoSideEfffects(log).notifyActivity({
            socket: params.socket,
            projectId: params.agent.projectId,
            activityId: comment.id,
            content: currentComment,
        })
    }
    await todoActivitiesService(log).update({
        id: comment.id,
        content: currentComment,
        socket: params.socket,
        projectId: params.agent.projectId,
    })

    await mcpClient.close()
    await todoService(log).resolve({
        id: todoId,
        status: RESOLVED_STATUS.name,
        socket: params.socket,
    })
    log.info({
        agentId: params.agent.id,
        mcpId: params.agent.mcpId,
    }, 'Agent execution completed')
}


async function createEmptyComment(params: ExecuteAgent, todoId: string, log: FastifyBaseLogger) {
    return todoActivitiesService(log).create({
        todoId,
        content: '',
        platformId: params.agent.platformId,
        projectId: params.agent.projectId,
        userId: null,
        agentId: params.agent.id,
        socket: params.socket,
    })
}

type ExecuteAgent = {
    agent: Agent
    userId?: string
    prompt: string
    socket: Socket
}