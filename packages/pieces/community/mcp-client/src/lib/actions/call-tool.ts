import { createAction, Property } from "@activepieces/pieces-framework";
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp';
import { McpProtocol, buildAuthHeaders } from "@activepieces/shared";
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export const callToolAction = createAction({
    name: 'call_tool',
    displayName: 'Call Tool',
    description: 'Directly call a specific tool from an external MCP server.',
    props: {
        protocol: Property.StaticDropdown({
            displayName: 'Protocol',
            required: true,
            options: {
                options: [
                    { label: 'SSE', value: McpProtocol.SSE },
                    { label: 'Simple HTTP', value: McpProtocol.SIMPLE_HTTP },
                    { label: 'Streamable HTTP', value: McpProtocol.STREAMABLE_HTTP },
                ]
            }
        }),
        serverUrl: Property.ShortText({
            displayName: 'Server URL',
            required: true,
        }),
        auth: Property.Json({
            displayName: 'Auth Configuration',
            required: false,
            description: 'Optional JSON for authentication (e.g., {"type": "BearerToken", "token": "..."})'
        }),
        toolName: Property.Dropdown({
            displayName: 'Tool Name',
            required: true,
            refreshers: ['protocol', 'serverUrl', 'auth'],
            options: async ({ propsValue }) => {
                if (!propsValue['protocol'] || !propsValue['serverUrl']) {
                    return { options: [], placeholder: 'Please provide protocol and server URL' };
                }
                try {
                    const transport = createTransport(
                        propsValue['protocol'] as McpProtocol,
                        propsValue['serverUrl'] as string,
                        buildAuthHeaders(propsValue['auth'] as any)
                    );
                    const client = await createMCPClient({ transport: transport as any });
                    const tools = await client.tools();
                    return {
                        options: Object.keys(tools).map(t => ({ label: t, value: t }))
                    };
                } catch (e) {
                    return { options: [], placeholder: `Error: ${e}` };
                }
            }
        }),
        arguments: Property.DynamicProperties({
            displayName: 'Arguments',
            required: true,
            refreshers: ['protocol', 'serverUrl', 'auth', 'toolName'],
            props: async ({ propsValue }) => {
                if (!propsValue['protocol'] || !propsValue['serverUrl'] || !propsValue['toolName']) {
                    return {};
                }
                try {
                    const transport = createTransport(
                        propsValue['protocol'] as McpProtocol,
                        propsValue['serverUrl'] as string,
                        buildAuthHeaders(propsValue['auth'] as any)
                    );
                    const client = await createMCPClient({ transport: transport as any });
                    const tools = await client.tools();
                    const tool = tools[propsValue['toolName'] as string];
                    
                    // Note: ai-sdk tools don't directly expose JSON schema in a simple way 
                    // in some versions, but we can try to extract or handle it.
                    // For a robust implementation, we might need a more direct MCP client 
                    // or use the internal schema if available.
                    
                    // For now, let's assume we can prompt for a JSON object or 
                    // if we have the schema, map it.
                    return {
                        'input': Property.Json({
                            displayName: 'Tool Arguments (JSON)',
                            required: true,
                            defaultValue: {}
                        })
                    };
                } catch (e) {
                    return {};
                }
            }
        })
    },
    async run({ propsValue }) {
        const transport = createTransport(
            propsValue.protocol as McpProtocol,
            propsValue.serverUrl,
            buildAuthHeaders(propsValue.auth as any)
        );
        const client = await createMCPClient({ transport: transport as any });
        const tools = await client.tools();
        const tool = tools[propsValue.toolName as string];
        
        const result = await tool.execute(propsValue.arguments['input']);
        return result;
    }
});

function createTransport(protocol: McpProtocol, serverUrl: string, headers: Record<string, string> = {}) {
    const url = new URL(serverUrl);
    switch (protocol) {
        case McpProtocol.SIMPLE_HTTP:
            return { type: 'http', url: serverUrl, headers };
        case McpProtocol.STREAMABLE_HTTP:
            return new StreamableHTTPClientTransport(url, { requestInit: { headers } });
        case McpProtocol.SSE:
            return { type: 'sse', url: serverUrl, headers };
        default:
            throw new Error(`Unsupported protocol: ${protocol}`);
    }
}
