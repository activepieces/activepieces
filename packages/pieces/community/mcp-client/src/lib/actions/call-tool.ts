import { createAction, Property } from "@activepieces/pieces-framework";
import { createMCPClient } from '@ai-sdk/mcp';
import { McpProtocol, buildAuthHeaders, McpAuthType } from "@activepieces/shared";
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
            description: 'Optional JSON for authentication (e.g., {"type": "headers", "headers": {"Authorization": "Bearer ..."}})'
        }),
        toolName: Property.Dropdown({
            displayName: 'Tool Name',
            required: true,
            refreshers: ['protocol', 'serverUrl', 'auth'],
            options: async ({ propsValue }) => {
                if (!propsValue['protocol'] || !propsValue['serverUrl']) {
                    return { options: [], placeholder: 'Please provide protocol and server URL' };
                }
                const transport = createTransport(
                    propsValue['protocol'] as McpProtocol,
                    propsValue['serverUrl'] as string,
                    buildAuthHeaders((propsValue['auth'] as any) ?? { type: McpAuthType.NONE })
                );
                try {
                    const client = await createMCPClient({ transport: transport as any });
                    const tools = await client.tools();
                    return {
                        options: Object.entries(tools).map(([name, tool]) => ({ 
                            label: name, 
                            value: name,
                            description: (tool as any).description 
                        }))
                    };
                } catch (e) {
                    return { options: [], placeholder: `Error: ${e}` };
                } finally {
                    await closeTransport(transport);
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
                const transport = createTransport(
                    propsValue['protocol'] as McpProtocol,
                    propsValue['serverUrl'] as string,
                    buildAuthHeaders((propsValue['auth'] as any) ?? { type: McpAuthType.NONE })
                );
                try {
                    const client = await createMCPClient({ transport: transport as any });
                    const tools = await client.tools();
                    const tool = tools[propsValue['toolName'] as string];
                    if (!tool) return {};

                    const description = (tool as any).description || 'Tool Arguments (JSON)';
                    // In the future, we can use zod-to-json-schema to show the schema here
                    // For now, at least we use the tool's description
                    return {
                        'input': Property.Json({
                            displayName: 'Arguments (JSON)',
                            description: description,
                            required: true,
                            defaultValue: {}
                        })
                    };
                } catch (e) {
                    return {};
                } finally {
                    await closeTransport(transport);
                }
            }
        })
    },
    async run({ propsValue }) {
        const transport = createTransport(
            propsValue.protocol as McpProtocol,
            propsValue.serverUrl,
            buildAuthHeaders((propsValue.auth as any) ?? { type: McpAuthType.NONE })
        );
        try {
            const client = await createMCPClient({ transport: transport as any });
            const tools = await client.tools();
            const tool = tools[propsValue.toolName as string];
            if (!tool) {
                throw new Error(`Tool ${propsValue.toolName} not found on server`);
            }

            const result = await tool.execute(propsValue.arguments['input']);
            return result;
        } finally {
            await closeTransport(transport);
        }
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

async function closeTransport(transport: any) {
    if (transport && typeof transport.close === 'function') {
        try {
            await transport.close();
        } catch (e) {
            console.error('Error closing MCP transport:', e);
        }
    }
}
