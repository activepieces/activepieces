# Huly MCP Server

A Model Context Protocol (MCP) server for Huly project and document management platform, allowing AI assistants to interact with Huly through Activepieces.

## Installation

```bash
npm install @zubeidhendricks/huly-mcp-server
```

## Features

This MCP server provides access to the following Huly functionalities:

### Search Actions
- **Find Person**: Fetch a list of people and their communication channels (e.g., email)
- **Find Project**: Retrieve a project by identifier and access its basic info
- **Find Issue**: List issues in a project sorted by last modified date
- **Find Document**: List documents in a teamspace by name

### Write Actions
- **Create Person**: Create a new person record and attach an email address
- **Create Issue**: Create a new issue under a project with title, description, priority, and due date
- **Create Milestone**: Create a new milestone inside a project and assign open issues to it
- **Create Document**: Create a document with Markdown content inside a teamspace

## Usage

```javascript
const { McpServer } = require('@zubeidhendricks/huly-mcp-server');

// Create and start the server
const server = new McpServer(3000, 'wss://api.huly.io');

server.start()
  .then(() => {
    console.log('Huly MCP Server started successfully');
  })
  .catch(console.error);
```

## API Documentation

Once the server is running, you can view the API documentation by accessing:
- `/manifest` - Shows all available MCP functions

## License

MIT
