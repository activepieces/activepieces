# AI Piece for Activepieces

This piece enables AI-related functionality for Activepieces.

## AI Tool Trigger

The AI Tool trigger allows you to expose your Activepieces flows as tools for AI agents through the MCP server.

### Features

- Define input parameters using JSON Schema
- Process requests from AI agents
- Return responses using the "Respond on UI" action

### How to Use

1. Add the AI Tool trigger to your flow
2. Configure the tool name, description, and input schema
3. Add the flow to your MCP server via the Activepieces UI
4. Process the incoming data and return a response

The trigger automatically validates incoming requests against your schema and extracts MCP-specific metadata to help with request handling.

# pieces-ai

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build pieces-ai` to build the library.
