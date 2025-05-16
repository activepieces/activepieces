import { apId, isNil } from '@activepieces/shared'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { FastifyBaseLogger, FastifyReply, FastifyRequest } from 'fastify'
import { distributedStore } from '../helper/keyvalue'
import { pubsub } from '../helper/pubsub'

type SessionData = {
    transport: StreamableHTTPServerTransport
}


const sessions: Map<string, SessionData> = new Map()
const serverId = apId()

export const mcpSessionManager = (logger: FastifyBaseLogger) => {
    return {
        init: async (): Promise<void> => {
                pubsub().subscribe(`server:${serverId}`, async (sessionId) => {
                    logger.info({ sessionId }, 'Received remove message')
                    try {
                        await remove(sessionId)
                        logger.info({ sessionId }, 'Session removed via pubsub')
                    }
                    catch (error) {
                        logger.error({ sessionId, error }, 'Failed to remove session')
                    }

            }).catch((error) => {
                logger.error({ error }, 'Failed to subscribe to pubsub')
            })
        },

        add: async (sessionId: string, transport: StreamableHTTPServerTransport): Promise<void> => {
            if (sessions.has(sessionId)) {
                throw new Error('Session already exists')
            }
            sessions.set(sessionId, { transport })
            logger.info({ sessionId }, 'MCP session added')

            // Store session information in distributed store
            await distributedStore().put(constructSessionKey(sessionId), serverId)
        },

        publish: async (sessionId: string): Promise<void> => {
            const serverId = await distributedStore().get<string>(constructSessionKey(sessionId))
            if (serverId) {
                logger.info({ sessionId }, 'Publishing remove message')
                await pubsub().publish(`server:${serverId}`, sessionId)
            }
        },

        get: async (sessionId: string): Promise<StreamableHTTPServerTransport> => {
            const sessionData = get(sessionId)
            if (!sessionData) {
                throw new Error('Session not found')
            }
            return sessionData.transport
        },

        hasTransport: async (sessionId: string): Promise<boolean> => {
            const sessionData = get(sessionId)
            return !!sessionData?.transport
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
    try {
        await session.transport.close()
        sessions.delete(sessionId)

        // Remove session information from distributed store
        await distributedStore().delete(constructSessionKey(sessionId))
    } catch (error) {
        throw new Error(`Failed to remove session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}
