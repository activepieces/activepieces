import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'

export function registerProjectTools(
    server: McpServer,
    projects: Array<{ id: string, displayName: string }>,
): void {
    server.tool(
        'list_projects',
        'List all projects accessible to the current user.',
        {},
        async () => {
            return {
                content: [{ type: 'text' as const, text: JSON.stringify(projects) }],
            }
        },
    )
}
