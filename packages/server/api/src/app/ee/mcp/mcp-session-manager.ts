import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { FastifyBaseLogger } from 'fastify';
import { isNil } from "packages/shared/src/lib/common/utils";

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


        remove: async (sessionId: string): Promise<void> => {
            logger.info({ sessionId }, 'Removing MCP session');
            const session = sessions.get(sessionId);
            if (isNil(session)) {
                return;
            }
            await session.server.close();
            await session.transport.close();
            sessions.delete(sessionId);
        },

        get: (sessionId: string): SessionData | undefined => {
            return sessions.get(sessionId);
        },

    };
};