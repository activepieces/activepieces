import { Agent, RESOLVED_STATUS } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { todoService } from '../todos/todo.service'
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { todoActivitiesService } from '../todos/activity/todos-activity.service'
import { Socket } from 'socket.io'
import { todoSideEfffects } from '../todos/todo-side-effects'

export const agentExecutor = (log: FastifyBaseLogger) => ({
    execute: async (params: ExecuteAgent) => {
        const { agent } = params
        const todo = await todoService(log).create({
            description: params.prompt,
            title: 'Agent Todos',
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
        })

        rejectedPromiseHandler(executeAgent(params, todo.id, log), log)
        return todo
    },
})

async function executeAgent(params: ExecuteAgent, todoId: string, log: FastifyBaseLogger) {
    let comment = await createEmptyComment(params, todoId, log)
    let currentComment = ''
    const { textStream } = await streamText({
        model: openai('gpt-4o'),    
        system: params.agent.systemPrompt,
        prompt: params.prompt,
        maxSteps: params.agent.maxSteps
    })
    for await (const chunk of textStream) {
        currentComment += chunk
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

    await todoService(log).resolve({
        id: todoId,
        status: RESOLVED_STATUS.name,
        socket: params.socket,
    })
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