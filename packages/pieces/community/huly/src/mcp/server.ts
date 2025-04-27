import express, { Request, Response, NextFunction } from 'express';
import { json } from 'express';
import { McpRequest, McpRequestSchema } from '../types';
import { handleMcpRequest } from './handlers';
import { getHulyClient } from '../api/hulyWebSocket';

export class McpServer {
  private app: express.Application;
  private port: number;
  private hulyWsUrl: string;
  private mockMode: boolean;

  constructor(port: number = 3000, mockMode: boolean = false) {
    this.app = express();
    this.port = port;
    this.mockMode = mockMode;
    this.hulyWsUrl = mockMode ? 'mock://huly.local' : 'wss://api.huly.io';
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Parse JSON request bodies
    this.app.use(json());
    
    // Basic request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
    
    // CORS middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }
      
      next();
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', mode: this.mockMode ? 'mock' : 'live' });
    });
    
    // MCP endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        // Validate the request
        const parseResult = McpRequestSchema.safeParse(req.body);
        
        if (!parseResult.success) {
          return res.status(400).json({
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error: Invalid JSON-RPC request',
              data: parseResult.error.message
            }
          });
        }
        
        const mcpRequest: McpRequest = parseResult.data;
        console.log(`Received request: ${mcpRequest.method} with params:`, mcpRequest.params);
        
        // Handle the request
        const response = await handleMcpRequest(mcpRequest);
        
        // Send the response
        console.log(`Response sent for request ID: ${mcpRequest.id}`);
        res.json(response);
      } catch (error: any) {
        console.error('Error processing MCP request:', error);
        
        // Fallback error response
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: 'Internal server error',
            data: error.message
          }
        });
      }
    });
    
    // MCP manifest endpoint
    this.app.get('/manifest', (req: Request, res: Response) => {
      res.json({
        name: 'Huly MCP Server',
        version: '0.1.0',
        description: 'MCP server for Huly project and document management',
        contact: {
          name: 'Activepieces',
          url: 'https://www.activepieces.com'
        },
        models: ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
        functions: [
          {
            name: 'huly.findPerson',
            description: 'Find people and their communication channels',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query to filter people by name or email'
                }
              }
            }
          },
          {
            name: 'huly.findProject',
            description: 'Find a project by identifier or name',
            parameters: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Project ID to search for'
                },
                name: {
                  type: 'string',
                  description: 'Project name to search for'
                }
              }
            }
          },
          {
            name: 'huly.findIssue',
            description: 'List issues in a project sorted by last modified date',
            parameters: {
              type: 'object',
              required: ['projectId'],
              properties: {
                projectId: {
                  type: 'string',
                  description: 'ID of the project to find issues for'
                }
              }
            }
          },
          {
            name: 'huly.findDocument',
            description: 'List documents in a teamspace by name',
            parameters: {
              type: 'object',
              required: ['teamspaceId'],
              properties: {
                teamspaceId: {
                  type: 'string',
                  description: 'ID of the teamspace to find documents in'
                },
                name: {
                  type: 'string',
                  description: 'Optional name filter for the documents'
                }
              }
            }
          },
          {
            name: 'huly.createPerson',
            description: 'Create a new person record with an email communication channel',
            parameters: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the person'
                },
                email: {
                  type: 'string',
                  description: 'Email address of the person'
                }
              }
            }
          },
          {
            name: 'huly.createIssue',
            description: 'Create a new issue in a project with title, description, priority, and due date',
            parameters: {
              type: 'object',
              required: ['projectId', 'title'],
              properties: {
                projectId: {
                  type: 'string',
                  description: 'ID of the project to create the issue in'
                },
                title: {
                  type: 'string',
                  description: 'Title of the issue'
                },
                description: {
                  type: 'string',
                  description: 'Optional description of the issue (supports Markdown)'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Priority level of the issue'
                },
                dueDate: {
                  type: 'string',
                  description: 'Due date of the issue in ISO format (YYYY-MM-DD)'
                }
              }
            }
          },
          {
            name: 'huly.createMilestone',
            description: 'Create a new milestone in a project and optionally assign issues to it',
            parameters: {
              type: 'object',
              required: ['projectId', 'name'],
              properties: {
                projectId: {
                  type: 'string',
                  description: 'ID of the project to create the milestone in'
                },
                name: {
                  type: 'string',
                  description: 'Name of the milestone'
                },
                dueDate: {
                  type: 'string',
                  description: 'Optional due date of the milestone in ISO format (YYYY-MM-DD)'
                },
                issueIds: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Optional list of issue IDs to assign to the milestone'
                }
              }
            }
          },
          {
            name: 'huly.createDocument',
            description: 'Create a document with Markdown content in a teamspace',
            parameters: {
              type: 'object',
              required: ['teamspaceId', 'name', 'content'],
              properties: {
                teamspaceId: {
                  type: 'string',
                  description: 'ID of the teamspace to create the document in'
                },
                name: {
                  type: 'string',
                  description: 'Name of the document'
                },
                content: {
                  type: 'string',
                  description: 'Content of the document (supports Markdown)'
                },
                projectIds: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Optional list of project IDs to link the document to'
                }
              }
            }
          }
        ]
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // In mock mode, skip actual connection
      if (!this.mockMode) {
        // Initialize connection to Huly
        const hulyClient = getHulyClient(this.hulyWsUrl);
        await hulyClient.connect();
      } else {
        console.log('Running in MOCK mode - skipping WebSocket connection');
      }
      
      // Start the server
      return new Promise((resolve) => {
        this.app.listen(this.port, () => {
          console.log(`Huly MCP Server running on port ${this.port}`);
          resolve();
        });
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  public stop(): void {
    // Only disconnect if not in mock mode
    if (!this.mockMode) {
      // Disconnect from Huly
      const hulyClient = getHulyClient();
      hulyClient.disconnect();
    }
    
    console.log('Huly MCP Server stopped');
  }
}