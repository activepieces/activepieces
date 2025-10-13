import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FastifyBaseLogger } from 'fastify'
import { randomUUID } from 'crypto'

const sessions: Map<string, SessionData> = new Map()
const SESSION_TTL_MS = 5 * 60 * 1000

export const flowMcpSessionManager = (logger: FastifyBaseLogger) => ({
    get: (sessionId: string): SessionData | undefined => {
        const sessionData = sessions.get(sessionId)
        if (sessionData) {
            sessionData.lastActivity = Date.now()
            clearTimeout(sessionData.timeout)
            sessionData.timeout = scheduleCleanup(sessionId, logger)
        }
        return sessionData
    },

    async create(server: McpServer): Promise<StreamableHTTPServerTransport> {
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
                const timeout = scheduleCleanup(sessionId, logger)
                sessions.set(sessionId, { 
                    server, 
                    transport,
                    timeout,
                    lastActivity: Date.now()
                })
                logger.info({ sessionId, ttlMs: SESSION_TTL_MS }, 'MCP Session initialized')
            },
        })

        transport.onclose = () => {
            if (transport.sessionId) {
                logger.info({ sessionId: transport.sessionId }, 'MCP Session closed')
                remove(transport.sessionId, logger)
            }
        }

        await server.connect(transport)
        return transport
    },
})

function scheduleCleanup(sessionId: string, logger: FastifyBaseLogger): NodeJS.Timeout {
    return setTimeout(async () => {
        const sessionData = sessions.get(sessionId)
        if (sessionData) {
            const timeSinceLastActivity = Date.now() - sessionData.lastActivity
            if (timeSinceLastActivity >= SESSION_TTL_MS) {
                logger.info({ sessionId }, 'Session TTL expired, cleaning up')
                await remove(sessionId, logger)
            } else {
                const sessionDataRefreshed = sessions.get(sessionId)
                if (sessionDataRefreshed) {
                    sessionDataRefreshed.timeout = scheduleCleanup(sessionId, logger)
                }
            }
        }
    }, SESSION_TTL_MS)
}

async function remove(sessionId: string, logger: FastifyBaseLogger): Promise<void> {
    const sessionData = sessions.get(sessionId)
    if (!sessionData) {
        return
    }

    try {
        clearTimeout(sessionData.timeout)
        await sessionData.server.close()
        await sessionData.transport.close()
        sessions.delete(sessionId)
        logger.info({ sessionId }, 'MCP Session removed')
    } catch (error) {
        logger.error({ sessionId, error }, 'Failed to remove session')
        throw new Error(`Failed to remove session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

type SessionData = {
    server: McpServer
    transport: StreamableHTTPServerTransport
    timeout: NodeJS.Timeout
    lastActivity: number
}