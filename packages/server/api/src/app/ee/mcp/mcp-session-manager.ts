import { apId, isNil } from '@activepieces/shared'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js'
import { FastifyBaseLogger } from 'fastify'
import { pubsub } from '../../helper/pubsub'
import { distributedStore } from '../../helper/keyvalue'

type SessionData = {
    server: McpServer
    transport: SSEServerTransport
}

const sessions: Map<string, SessionData> = new Map()
const serverId = apId()

export const mcpSessionManager = (logger: FastifyBaseLogger) => {
    const pubSub = pubsub()

    pubSub.subscribe(`server:${serverId}`, async (channel, message) => {
        const { sessionId, body, operation } = JSON.parse(message)
        logger.info({ sessionId, operation }, 'Received message')

        if (operation === 'remove') {
            await remove(sessionId)
            logger.info({ sessionId }, 'Session removed via pubsub')
            return
        }

        const sessionData = get(sessionId)

        if (!sessionData) {
            logger.info({ sessionId }, 'Session not found')
            return
        }

        await sessionData.transport.handleMessage(body)
        logger.info({ sessionId, body }, 'Handle operation')

    })

    return {
        add: (sessionId: string, server: McpServer, transport: SSEServerTransport): void => {
            if (sessions.has(sessionId)) {
                throw new Error('Session already exists')
            }
            sessions.set(sessionId, { server, transport })
            logger.info({ sessionId }, 'MCP session added')

            // Store session information in distributed store
            distributedStore.put(constructSessionKey(sessionId), serverId)
        },

        publish: async (sessionId: string, body: any, operation: 'remove' | 'message' = 'message'): Promise<void> => {
            const serverId = await distributedStore.get<string>(constructSessionKey(sessionId))
            if (serverId) {
                logger.info({ sessionId, body, operation }, 'Publishing message')
                await pubSub.publish(`server:${serverId}`, JSON.stringify({ sessionId, body, operation }))
            }
        }
    }
}
export function constructSessionKey(sessionId: string): string {
    return `session:${sessionId}`
}

export function get(sessionId: string): SessionData | undefined {
    return sessions.get(sessionId)
}

export async function remove(sessionId: string): Promise<void> {
    const session = sessions.get(sessionId)
    if (isNil(session)) {
        return
    }
    await session.server.close()
    await session.transport.close()
    sessions.delete(sessionId)

    // Remove session information from distributed store
    await distributedStore.delete(constructSessionKey(sessionId))
}
