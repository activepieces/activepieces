import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { Agent, isNil, RESOLVED_STATUS, TodoEnvironment } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { experimental_createMCPClient, generateText, streamText } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { domainHelper } from '../ee/custom-domains/domain-helper'
import { mcpService } from '../mcp/mcp-service'
import { todoActivitiesService } from '../todos/activity/todos-activity.service'
import { todoSideEfffects } from '../todos/todo-side-effects'
import { todoService } from '../todos/todo.service'


export const agentExecutor = (log: FastifyBaseLogger) => ({
    execute: async (params: ExecuteAgent) => {
        const { agent } = params
        const todo = await todoService(log).create({
            description: params.prompt,
            title: await generateTitle(params.prompt, params, log),
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

async function generateTitle(prompt: string, params: { agent: Agent }, log: FastifyBaseLogger) {
    const model = await initializeOpenAIModel(params.agent, 'gpt-4o-mini')
    const result = await generateText({
        model,
        prompt: `
        You are a helpful assistant that generates concise, clear, and relevant todo titles based on user descriptions. Only return the title, nothing else.
        User description: ${prompt}
        `,
    })
    return result.text
}

async function executeAgent(params: ExecuteAgent, todoId: string, log: FastifyBaseLogger) {
    const comment = await createEmptyComment(params, todoId, log)
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
    })
    const tools = await mcpClient.tools()
    const currentDate = new Date().toISOString().split('T')[0]
    let textResult = ''
    const model = await initializeOpenAIModel(params.agent, 'gpt-4o')
    const { fullStream } = streamText({
        model,
        system: `
        You are an autonomous assistant designed to efficiently achieve the user's single-shot goal using tools. Prioritize accuracy, minimal steps, and user-friendly clarity.
        
        **Today's Date**: ${currentDate}  
        Use this to interpret time-based queries like "this week" or "due tomorrow."

        ---
        ${params.agent.systemPrompt}
        `,
        prompt: params.prompt,
        maxSteps: params.agent.maxSteps,
        tools,
    })
    for await (const chunk of fullStream) {
        if (chunk.type === 'text-delta') {
            textResult += chunk.textDelta
            currentComment += chunk.textDelta
        }

        else if (chunk.type === 'tool-call') {
            currentComment += `<tool-call id="${chunk.toolCallId}">${JSON.stringify({
                toolName: chunk.toolName,
                result: chunk.args,
            })}</tool-call>`
        }
        else if (chunk.type === 'tool-result') {
            const textResult = chunk.result
            currentComment += `<tool-result id="${chunk.toolCallId}">${JSON.stringify({
                result: textResult,
            })}</tool-result>`
        }
        await todoSideEfffects(log).notifyActivity({
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

    if (!isNil(params.callbackUrl)) {
        await fetch(params.callbackUrl, {
            method: 'POST',
            body: JSON.stringify({ output: textResult }),
        })
    }
    log.info({
        agentId: params.agent.id,
        mcpId: params.agent.mcpId,
    }, 'Agent execution completed')
}

async function initializeOpenAIModel(agent: Agent, model: string) {
    const baseUrl = await domainHelper.getPublicApiUrl({
        path: '/v1/ai-providers/proxy/openai/v1/',
        platformId: agent.platformId,
    })
    const apiKey = await accessTokenManager.generateEngineToken({
        platformId: agent.platformId,
        projectId: agent.projectId,
    })
    return createOpenAI({
        baseURL: baseUrl,
        apiKey,
    }).chat(model)
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
    callbackUrl?: string
    userId?: string
    prompt: string
    socket: Socket
}