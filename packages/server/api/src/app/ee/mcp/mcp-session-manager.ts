import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { FastifyBaseLogger } from 'fastify';

interface SessionData {
    server: McpServer;
    transport: SSEServerTransport;
}

const sessions: Map<string, SessionData> = new Map();

export const mcpSessionManager = (logger: FastifyBaseLogger) => {
    
    return {
        add: (sessionId: string, server: McpServer, transport: SSEServerTransport, mcpId: string): void => {
            if (sessions.has(sessionId)) {
                throw new Error("Session already exists");
            }
            
            sessions.set(sessionId, { server, transport });
            logger.info({ sessionId }, 'MCP session added');
        },


        remove: (sessionId: string): void => {
            const session = sessions.get(sessionId);
            if (session) {
                
                try {
                    sessions.delete(sessionId);
                    logger.info({ sessionId }, 'MCP session removed');
                } catch (error) {
                    logger.error({ error, sessionId }, 'Error while removing MCP session');
                }
            }
        },

        removeAll: (): void => {
            for (const [sessionId, session] of sessions.entries()) {
                sessions.delete(sessionId);
            }
        },
        
        get: (sessionId: string): SessionData | undefined => {
            return sessions.get(sessionId);
        },

    };
};