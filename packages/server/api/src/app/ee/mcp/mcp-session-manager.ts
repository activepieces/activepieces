import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { EventEmitter } from 'node:events';
import { FastifyBaseLogger } from 'fastify';

interface SessionData {
    server: McpServer;
    transport: SSEServerTransport;
    mcpId: string;
}


/**
 * Manages MCP sessions and their lifecycle
 */
export class McpSessionManager extends EventEmitter {
    private sessions: Map<string, SessionData> = new Map();
    private logger: FastifyBaseLogger;

    constructor(logger: FastifyBaseLogger) {
        super({ captureRejections: true });
        this.logger = logger;
    }

    /**
     * Add a session for an MCP
     */
    public add(sessionId: string, server: McpServer, transport: SSEServerTransport, mcpId: string): void {
        if (this.sessions.has(sessionId)) {
            throw new Error("Session already exists");
        }
        
        this.sessions.set(sessionId, { server, transport, mcpId });
        this.logger.info({ sessionId, mcpId }, 'MCP session added');
        this.emit('connected', sessionId, mcpId);
    }

    /**
     * Remove a session
     */
    public remove(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            const { mcpId } = session;
            
            try {
                this.sessions.delete(sessionId);
                this.logger.info({ sessionId, mcpId }, 'MCP session removed');
                this.emit('terminated', sessionId, mcpId);
            } catch (error) {
                this.logger.error({ error, sessionId, mcpId }, 'Error while removing MCP session');
                this.emit('error', error, sessionId);
            }
        }
    }

    /**
     * Get a session by ID
     */
    public get(sessionId: string): SessionData | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * Get a session by MCP ID
     */
    public getByMcpId(mcpId: string): SessionData | undefined {
        for (const [_, session] of this.sessions.entries()) {
            if (session.mcpId === mcpId) {
                return session;
            }
        }
        return undefined;
    }

    /**
     * Get the number of active sessions
     */
    public get count(): number {
        return this.sessions.size;
    }

    /**
     * Get all active sessions
     */
    public getAllSessions(): SessionData[] {
        return Array.from(this.sessions.values());
    }
} 