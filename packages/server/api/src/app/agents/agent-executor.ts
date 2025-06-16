import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { Agent, AGENT_REJECTED_STATUS_OPTION, AGENT_RESOLVED_STATUS_OPTION, AGENT_STATUS_OPTIONS, agentbuiltInToolsNames, agentMarkdownParser, isNil, TodoEnvironment } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
// import { domainHelper } from '../ee/custom-domains/domain-helper'
import { domainHelper } from '../helper/domain-helper'
import { todoActivitiesService } from '../todos/activity/todos-activity.service'
import { todoSideEfffects } from '../todos/todo-side-effects'
import { todoService } from '../todos/todo.service'
import { agentTools } from './agent-tools'


export const agentExecutor = (log: FastifyBaseLogger) => ({
    execute: async (params: ExecuteAgent) => {
        const { agent } = params
        const todo = await todoService(log).create({
            description: params.prompt,
            title: await generateTitle(params.prompt, agent),
            statusOptions: AGENT_STATUS_OPTIONS,
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
    const comment = await createEmptyComment(params, todoId, log)
    log.info({
        agentId: params.agent.id,
        mcpId: params.agent.mcpId,
    }, 'Starting agent execution')
    const agentToolInstance = await agentTools({
        agent: params.agent,
        todoId,
        socket: params.socket,
        log,
    })
    try {
        const model = await initializeOpenAIModel(params.agent, 'gpt-4o')
        const { fullStream } = streamText({
            model,
            system: constructSystemPrompt(params.agent),
            prompt: params.prompt,
            maxSteps: params.agent.maxSteps,
            tools: await agentToolInstance.tools(),
        })
        const toolsCalled = []
        let currentComment = ''

        let textResult = ''
        for await (const chunk of fullStream) {
            if (chunk.type === 'text-delta') {
                textResult += chunk.textDelta
                currentComment += chunk.textDelta
            }
            else if (chunk.type === 'tool-call') {
                toolsCalled.push(chunk.toolName)
                const metadata = await agentToolInstance.getMetadata(chunk.toolName)
                currentComment += `<tool-call id="${chunk.toolCallId}">${JSON.stringify({
                    toolName: chunk.toolName,
                    displayName: metadata.displayName,
                    logoUrl: metadata.logoUrl,
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

        const success = toolsCalled.includes(agentbuiltInToolsNames.markAsComplete)
        await markCompleted(success, todoId, log, params.socket, params.agent)
        await callbackIfUrlIsProvided(params, todoId, textResult)
        log.info({
            agentId: params.agent.id,
            mcpId: params.agent.mcpId,
        }, 'Agent execution completed')
    }
    finally {
        await agentToolInstance.close()
    }
}



async function markCompleted(success: boolean, todoId: string, log: FastifyBaseLogger, socket: Socket, agent: Agent) {
    if (!success) {
        await todoService(log).update({
            id: todoId,
            status: AGENT_REJECTED_STATUS_OPTION,
            platformId: agent.platformId,
            projectId: agent.projectId,
            socket,
        })
    }
    else {
        await todoService(log).resolve({
            id: todoId,
            status: AGENT_RESOLVED_STATUS_OPTION.name,
            socket,
        })
    }
}

async function callbackIfUrlIsProvided(params: ExecuteAgent, todoId: string, textResult: string) {
    if (isNil(params.callbackUrl)) {
        return
    }
    const agentResult = agentMarkdownParser.findAgentResult({
        todoId,
        output: textResult,
    })
    await fetch(params.callbackUrl, {
        method: 'POST',
        body: JSON.stringify(agentResult),
    })
}

function constructSystemPrompt(agent: Agent) {
    return `
    You are an autonomous assistant designed to efficiently achieve the user's goal.

    YOU MUST ALWAYS call the mark as complete tool with the output or message wether you have successfully completed the task or not.

    **Today's Date**: ${dayjs().format('YYYY-MM-DD')}
    Use this to interpret time-based queries like "this week" or "due tomorrow."

    ---
    ${agent.systemPrompt}
    `
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

async function generateTitle(prompt: string, agent: Agent) {
    const model = await initializeOpenAIModel(agent, 'gpt-4o-mini')
    const result = await generateText({
        model,
        prompt: `
        You are a helpful assistant that generates concise, clear, and relevant todo titles based on user descriptions. Only return the title, nothing else.
        User description: ${prompt}
        `,
    })
    return result.text
}

type ExecuteAgent = {
    agent: Agent
    callbackUrl?: string
    userId?: string
    prompt: string
    socket: Socket
}
