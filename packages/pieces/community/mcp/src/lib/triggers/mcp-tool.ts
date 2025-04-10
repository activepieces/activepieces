import {
    createTrigger,
    Property,
    TriggerStrategy,
  } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


  
  const liveMarkdown = `**Live URL:**
  \`\`\`text
  {{webhookUrl}}
  \`\`\`
  generate sample data & triggers published flow.
  
  `;
  
  
  const syncMarkdown = `**Synchronous Requests:**
  
  If you expect a response from this webhook, add \`/sync\` to the end of the URL. 
  If it takes more than 30 seconds, it will return a 408 Request Timeout response.
  
  To return data, add an Webhook step to your flow with the Return Response action.
  `;
  

  export const mcpTool = createTrigger({
    name: 'mcp_tool',
    displayName: 'MCP Tool',
    description: 'run a flow in MCP',
    props: {
      liveMarkdown: Property.MarkDown({
        value: liveMarkdown,
        variant: MarkdownVariant.BORDERLESS,
      }),
      syncMarkdown: Property.MarkDown({
        value: syncMarkdown,
        variant: MarkdownVariant.INFO,
      }),
      toolName: Property.ShortText({
        displayName: 'Tool Name',
        description: 'The name of the tool',
        required: true,
      }),
      toolDescription: Property.LongText({
        displayName: 'Tool Description',
        description: 'The description of the tool',
        required: true,
      }),
      inputSchema: Property.Json({
        displayName: 'Input Schema',
        description: 'The schema for the tool input',
        required: true,
      }),
      returnsResponse: Property.Checkbox({
        displayName: 'Returns Response',
        description: 'Whether the tool returns a response',
        defaultValue: true,
        required: true,
      }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: null,
    async onEnable() {
      // rebuild mcp server (get enabled mcp flows on the backend so no need to do anything here)
      // user just needs to restart the server
    },
    async onDisable() {
      // rebuild mcp server
    },
    async run(context) {
      const token = context.server.token;
      const mcpId = context.payload.headers['mcpId'];

      // need to query backend to get mcpId for this projectId using api request
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${context.server.apiUrl}/v1/mcp`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // if (response.body.id !== mcpId) {
      //   throw new Error('Invalid mcpId');
      // }

      // run flow
      return [context.payload];
    },
  });
  
  