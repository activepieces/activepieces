import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { Agent, AGENT_REJECTED_STATUS_OPTION, AGENT_RESOLVED_STATUS_OPTION, AGENT_STATUS_OPTIONS, agentOutputUtils, AgentTaskStatus, AgentTestResult, assertNotNullOrUndefined, ContentBlockType, isNil, RichContentBlock, TodoEnvironment, ToolCallContentBlock, ToolCallStatus, ToolCallType } from '@activepieces/shared'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText, streamText } from 'ai'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { Socket } from 'socket.io'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { domainHelper } from '../ee/custom-domains/domain-helper'
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
        const blocks: RichContentBlock[] = []
        let currentText = ''

        for await (const chunk of fullStream) {
            if (chunk.type === 'text-delta') {
                currentText += chunk.textDelta
            }
            else if (chunk.type === 'tool-call') {
                if (currentText.length > 0) {
                    blocks.push({
                        type: ContentBlockType.MARKDOWN,
                        markdown: currentText,
                    })
                    currentText = ''
                }
                const metadata = await agentToolInstance.getMetadata(chunk.toolName)
                blocks.push({
                    type: ContentBlockType.TOOL_CALL,   
                    toolCallId: chunk.toolCallId,
                    toolCallType: isNil(metadata.logoUrl) ? ToolCallType.FLOW : ToolCallType.PIECE,
                    displayName: metadata.displayName,
                    name: chunk.toolName,
                    logoUrl: metadata.logoUrl,
                    status: ToolCallStatus.IN_PROGRESS,
                    startTime: new Date().toISOString(),
                    input: chunk.args,
                })
            }
            else if (chunk.type === 'tool-result') {
                const lastBlockIndex = blocks.findIndex((block) => block.type === ContentBlockType.TOOL_CALL && block.toolCallId === chunk.toolCallId)
                const lastBlock = blocks[lastBlockIndex] as ToolCallContentBlock
                assertNotNullOrUndefined(lastBlock, 'Last block must be a tool call')
                blocks[lastBlockIndex] = {
                    type: ContentBlockType.TOOL_CALL,
                    toolCallId: lastBlock.toolCallId,
                    toolCallType: lastBlock.toolCallType,
                    displayName: lastBlock.displayName,
                    name: lastBlock.name,
                    logoUrl: lastBlock.logoUrl,
                    status: ToolCallStatus.COMPLETED,
                    startTime: lastBlock.startTime,
                    endTime: new Date().toISOString(),
                    input: lastBlock.input,
                    output: chunk.result,
                }
            }
            await todoSideEfffects(log).notifyActivity({
                socket: params.socket,
                projectId: params.agent.projectId,
                activityId: comment.id,
                todoId,
                content: blocks,
            })
        }
        if (currentText.length > 0) {
            blocks.push({
                type: ContentBlockType.MARKDOWN,
                markdown: currentText,
            })
        }
        await todoActivitiesService(log).update({
            id: comment.id,
            content: blocks,
            socket: params.socket,
            projectId: params.agent.projectId,
        })

        const agentResult = agentOutputUtils.findAgentResult({
            todoId,
            content: blocks,
        })
        await markCompleted(agentResult.status, todoId, log, params.socket, params.agent)
        await callbackIfUrlIsProvided(params, agentResult)
        log.info({
            agentId: params.agent.id,
            mcpId: params.agent.mcpId,
        }, 'Agent execution completed')
    }
    finally {
        await agentToolInstance.close()
    }
}



async function markCompleted(agentStatus: AgentTaskStatus, todoId: string, log: FastifyBaseLogger, socket: Socket, agent: Agent) {
    if (agentStatus === AgentTaskStatus.FAILED) {
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

async function callbackIfUrlIsProvided(params: ExecuteAgent, agentResult: AgentTestResult) {
    if (isNil(params.callbackUrl)) {
        return
    }
    await fetch(params.callbackUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
        content: [],
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