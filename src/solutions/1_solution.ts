#!/usr/bin/env node

/**
 * Canva MCP Server - Design Integration
 * 
 * This is a Model Context Protocol (MCP) server that integrates with the Canva API
 * to list, retrieve, and manage Canva designs. Useful for Activepieces and LLM integrations.
 * 
 * Prerequisites:
 * npm install @modelcontextprotocol/sdk
 * 
 * Usage:
 * CANVA_BEARER_TOKEN="your_canva_access_token" npx ts-node canva-mcp-server.ts
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const CANVA_API_BASE = "https://api.canva.com/rest/v1";

class CanvaMcpServer {
  private server: Server;
  private token: string;

  constructor() {
    this.token = process.env.CANVA_BEARER_TOKEN || "";
    
    if (!this.token) {
      console.error("Error: CANVA_BEARER_TOKEN environment variable is required.");
      process.exit(1);
    }

    this.server = new Server(
      {
        name: "canva-design-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    // Register available Canva tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "canva_list_designs",
            description: "Retrieve a list of designs from the authenticated Canva account.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query to filter designs by title.",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of designs to return (default 25).",
                },
              },
            },
          },
          {
            name: "canva_get_design",
            description: "Get metadata and details of a specific Canva design by ID.",
            inputSchema: {
              type: "object",
              properties: {
                design_id: {
                  type: "string",
                  description: "The unique identifier of the Canva design.",
                },
              },
              required: ["design_id"],
            },
          },
        ],
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "canva_list_designs":
          return this.handleListDesigns(request.params.arguments);
        case "canva_get_design":
          return this.handleGetDesign(request.params.arguments);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private async fetchCanva(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${CANVA_API_BASE}${endpoint}`;
    
    const headers = {
      "Authorization": `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, { ...options, headers });
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new McpError(
          ErrorCode.InternalError,
          `Canva API Error (${response.status}): ${errorBody}`
        );
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to communicate with Canva API: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleListDesigns(args: any) {
    try {
      const queryParams = new URLSearchParams();
      if (args?.query) queryParams.append("query", args.query);
      if (args?.limit) queryParams.append("limit", args.limit.toString());

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
      const data = await this.fetchCanva(`/designs${queryString}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(ErrorCode.InternalError, "Failed to list Canva designs");
    }
  }

  private async handleGetDesign(args: any) {
    if (!args?.design_id) {
      throw new McpError(ErrorCode.InvalidParams, "design_id is required");
    }

    try {
      const data = await this.fetchCanva(`/designs/${args.design_id}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(ErrorCode.InternalError, `Failed to fetch design ${args.design_id}`);
    }
  }

  public async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Canva Design MCP Server is running and listening on stdio.");
  }
}

const server = new CanvaMcpServer();
server.run().catch((error) => {
  console.error("Fatal error starting Canva MCP Server:", error);
  process.exit(1);
});
