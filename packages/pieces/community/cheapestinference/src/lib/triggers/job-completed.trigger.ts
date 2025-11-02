import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
generate sample data & triggers published flow.

`;

const testMarkdown = `
**Test URL:**

if you want to generate sample data without triggering the flow, append \`/test\` to your webhook URL.

`;

const syncMarkdown = `**Synchronous Requests:**

If you expect a response from this webhook, add \`/sync\` to the end of the URL. 
If it takes more than 30 seconds, it will return a 408 Request Timeout response.

To return data, add an Webhook step to your flow with the Return Response action.
`;

export const jobCompletedTrigger = createTrigger({
  name: 'job_completed',
  displayName: 'On Job Completed',
  description:
    'Receive incoming HTTP/webhooks using any HTTP method such as GET, POST, PUT, DELETE, etc.',
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    syncMarkdown: Property.MarkDown({
      value: syncMarkdown,
      variant: MarkdownVariant.INFO,
    }),
    testMarkdown: Property.MarkDown({
      value: testMarkdown,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    job: {
      id: 'job_example_123',
      status: 'COMPLETED',
      completedAt: '2025-11-02T12:21:03.087Z',
      outputUrl: 'https://api.cheapestinference.com/v1/files/results/job_example_123',
    },
    summary: {
      model: 'arcee-ai/AFM-4.5B',
      tokens: { prompt: 201, completion: 304, total: 505 },
      texts: [
        'Hello! This is an example completion text returned by the model.'
      ],
      count: 1,
    },
    results: [
      {
        customId: 'req-job_example_123',
        created: 1762085998,
        model: 'arcee-ai/AFM-4.5B',
        usage: { prompt: 201, completion: 304, total: 505 },
        choices: [
          {
            index: 0,
            finishReason: 'stop',
            message: {
              role: 'assistant',
              content: 'Hello! This is an example completion text returned by the model.',
              toolCalls: [],
            },
          },
        ],
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // ignore
  },
  async onDisable() {
    // ignore
  },
  async run(context) {
    
    // Log any additional properties that might be available
    const payload = context.payload as any;
    const outputFileUrl = payload?.output_file_url || payload?.body?.output_file_url;

    if (!outputFileUrl) {
      console.log('No output_file_url found in payload, returning original payload');
      return [context.payload];
    }


    try {
      // 1) Fetch JSON that contains the pre-signed URL using auth
      const initialResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: outputFileUrl,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${context.auth}`,
        },
      });


      const bodyObj = typeof initialResponse.body === 'string'
        ? JSON.parse(initialResponse.body)
        : initialResponse.body;
      let signedUrl: string | undefined;  
      signedUrl = bodyObj.download_url;

     
      if (!signedUrl || typeof signedUrl !== 'string') {
        throw new Error('Signed URL not found in response body');
      }

      // 2) Download the actual file from the pre-signed URL WITHOUT auth
      const downloadResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: signedUrl,
        headers: {
          'Accept': 'text/plain, application/x-ndjson, */*',
        },
      });


      const fileContent = typeof downloadResponse.body === 'string'
        ? downloadResponse.body
        : JSON.stringify(downloadResponse.body);


      // Parse JSONL: each line is a JSON object
      const lines = fileContent.trim().split('\n').filter(line => line.trim() !== '');
      const parsedData = lines.map((line, index) => {
        try {
          return JSON.parse(line);
        } catch (parseError: any) {
          console.error(`Error parsing JSONL line ${index + 1}:`, parseError);
          console.error('Line content:', line);
          throw new Error(`Failed to parse JSONL line ${index + 1}: ${parseError?.message || 'Unknown parse error'}`);
        }
      });

      const results = parsedData.map((item: any) => {
        const body = item?.response?.body ?? {};
        const usage = body?.usage ?? {};
        const rawChoices = Array.isArray(body?.choices) ? body.choices : [];
        const choices = rawChoices.map((ch: any) => ({
          index: ch?.index,
          finishReason: ch?.finish_reason,
          message: {
            role: ch?.message?.role,
            content: ch?.message?.content,
            toolCalls: ch?.message?.tool_calls ?? [],
          },
        }));
        return {
          customId: item?.custom_id ?? null,
          created: body?.created ?? null,
          model: body?.model ?? null,
          usage: {
            prompt: usage?.prompt_tokens ?? null,
            completion: usage?.completion_tokens ?? null,
            total: usage?.total_tokens ?? null,
          },
          choices,
        };
      });

      const texts = results.flatMap(r => r.choices.map((c: any) => c?.message?.content).filter((t: any) => Boolean(t)));
      const firstUsage = results[0]?.usage ?? { prompt: null, completion: null, total: null };
      const firstModel = results[0]?.model ?? null;

      return [{
        job: {
          id: payload?.body?.job_id ?? payload?.job_id ?? null,
          status: payload?.body?.status ?? payload?.status ?? null,
          completedAt: payload?.body?.completed_at ?? payload?.completed_at ?? null,
          outputUrl: outputFileUrl,
        },
        summary: {
          model: firstModel,
          tokens: firstUsage,
          texts,
          count: parsedData.length,
        },
        results,
      }];
    } catch (error: any) {
      console.error('=== Error Downloading/Parsing File ===');
      console.error('Error:', error);
      console.error('Error message:', error?.message);
      console.error('================================');
      
      return [{
        ...payload,
        output_file_url: outputFileUrl,
        error: `Failed to download/parse output file: ${error?.message || 'Unknown error'}`,
      }];
    }
  },
});








