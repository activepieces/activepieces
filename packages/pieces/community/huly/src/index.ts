import { McpServer } from './mcp/server';

// Load environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
// Use a mock mode for the demo
const MOCK_MODE = true;

// Create the server with mock mode
const server = new McpServer(PORT, MOCK_MODE);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  server.stop();
  process.exit(0);
});

// Start the server
server.start()
  .then(() => {
    console.log(`Huly MCP Server started successfully in ${MOCK_MODE ? 'MOCK' : 'LIVE'} mode`);
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`API Manifest available at http://localhost:${PORT}/manifest`);
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
