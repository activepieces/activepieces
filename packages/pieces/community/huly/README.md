# Huly MCP Server

This is a Model Context Protocol (MCP) server for Huly project and document management platform, allowing AI assistants to interact with Huly through Activepieces.

## What is MCP?

Model Context Protocol (MCP) allows AI assistants to access external tools through a standardized interface. This server implements the MCP specification for Huly's WebSocket APIs.

## Features

This MCP server provides access to the following Huly functionalities:

### Search Actions
- **Find Person**: Fetch a list of people and their communication channels (e.g., email)
- **Find Project**: Retrieve a project by identifier and access its basic info
- **Find Issue**: List issues in a project sorted by last modified date
- **Find Document**: List documents in a teamspace by name

### Write Actions
- **Create Person**: Create a new person record and attach an email address as a communication channel
- **Create Issue**: Create a new issue under a project with title, description, priority, and due date
- **Create Milestone**: Create a new milestone inside a project and assign open issues to it
- **Create Document**: Create a document with Markdown content inside a teamspace

## Installation

```bash
# Clone the repository
git clone https://github.com/username/huly-mcp-server

# Navigate to the project directory
cd huly-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### Configuration

The server can be configured using environment variables:

- `PORT`: The port number to run the server on (default: 3000)
- `HULY_WS_URL`: The WebSocket URL for the Huly API (default: wss://api.huly.io)

### Running the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Endpoints

- **Health Check**: `GET /health`
- **MCP Endpoint**: `POST /mcp` - Main endpoint for MCP requests
- **Manifest**: `GET /manifest` - MCP API manifest with function descriptions

## MCP Integration with Activepieces

To use this MCP server with Activepieces:

1. Deploy this server to a publicly accessible URL
2. Configure the MCP URL in Activepieces to point to your deployed server
3. Use the Huly functions in your AI workflows


## Development

### Project Structure

```
src/
├── api/               # Huly API integration
│   ├── hulyApi.ts     # API function implementations
│   └── hulyWebSocket.ts # WebSocket client for Huly
├── mcp/               # MCP server implementation
│   ├── handlers.ts    # MCP request handlers
│   └── server.ts      # Express server setup
├── types/             # TypeScript type definitions
│   └── index.ts       # Type definitions
└── index.ts           # Application entry point
```

### Testing

```bash
# Run tests
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
