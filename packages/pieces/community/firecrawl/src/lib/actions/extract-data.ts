import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { polling, FIRECRAWL_API_BASE_URL } from '../common/common';
import { extractDataActionOutputSchema } from '../output-schemas';

export const extractData = createAction({
  auth: firecrawlAuth,
  name: 'extract_data',
  displayName: 'Extract Data',
  description: 'Extract structured data from one or more known URLs using AI.',
  audience: 'ai',
  outputSchema: extractDataActionOutputSchema,
  aiMetadata: {
    description:
      'Runs an AI extraction over one or more known URLs against a natural-language prompt and a JSON Schema, returning the typed fields you asked for. Pick this when you need specific structured values from pages whose URLs you already have; use Scrape URL for raw page content, Map Website / Search Web to find URLs first. Runs as a polled job bounded by the timeout; read-only against the sites, so repeating is safe. Note: Firecrawl is deprecating /v2/extract in favor of the agent endpoint.',
    idempotent: true,
  },
  props: {
    urls: Property.Array({
      displayName: 'URLs',
      description: 'One or more page URLs to extract data from. Obtain them from Search Web or Map Website if needed.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Extraction Prompt',
      description: 'Describe what information to extract from the pages.',
      required: false,
      defaultValue: 'Extract the following data from the provided content.',
    }),
    schema: Property.Json({
      displayName: 'JSON Schema',
      description: 'A JSON Schema object describing the structured fields to extract (e.g. {"type":"object","properties":{"title":{"type":"string"}},"required":["title"]}). See https://json-schema.org for the format.',
      required: true,
      defaultValue: {
        type: 'object',
        properties: {
          title: { type: 'string' },
        },
        required: ['title'],
      },
    }),
    enableWebSearch: Property.Checkbox({
      displayName: 'Enable Web Search',
      description: 'Allow the extraction to use web search for additional context.',
      required: false,
      defaultValue: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'Seconds to poll for completion before giving up.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const urlsArray = (propsValue.urls as unknown[]).map((u) => String(u));

    const body: Record<string, any> = {
      urls: urlsArray,
      schema: propsValue.schema,
    };
    if (propsValue.prompt) {
      body['prompt'] = propsValue.prompt;
    }
    if (propsValue.enableWebSearch) {
      body['enableWebSearch'] = true;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${FIRECRAWL_API_BASE_URL}/extract`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.secret_text}`,
        },
        body,
      });

      const jobId = response.body.id;
      const timeoutSeconds = propsValue.timeout || 300;
      return await polling(jobId, auth.secret_text, timeoutSeconds, 'extract');
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 403) {
        throw new Error('Firecrawl denied the request (403): your API key plan does not permit extraction or has insufficient credits.');
      }
      if (status === 404) {
        throw new Error('Extraction target not found (404): one of the URLs could not be reached.');
      }
      if (status === 429) {
        throw new Error('Firecrawl rate limit reached (429): slow down requests or upgrade your plan, then retry.');
      }
      throw error;
    }
  },
});
