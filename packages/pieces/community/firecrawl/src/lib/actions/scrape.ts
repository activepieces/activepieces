import { createAction, Property, InputPropertyMap, MarkdownVariant } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../auth';
import { forScreenshotOutputFormat, forSimpleOutputFormat, saveFirecrawlFile, forJsonOutputFormat, FIRECRAWL_API_BASE_URL, FIRECRAWL_ORIGIN } from '../common/common';
import { scrapeActionOutputSchema } from '../output-schemas';

function forDefaultScreenshot(): any {
  return {
    type: 'screenshot',
    fullPage: true,
  };
}

export const scrape = createAction({
  auth: firecrawlAuth,
  name: 'scrape',
  classification: 'READ',
  displayName: 'Scrape Website',
  description: 'Read one web page as Markdown, HTML, links, a screenshot or JSON.',
  audience: 'human',
  outputSchema: scrapeActionOutputSchema,
  aiMetadata: { description: 'Fetches the content of a single web page and returns it in a chosen format (markdown, HTML, links, summary, screenshot, or AI-extracted JSON). Choose this to read one specific URL; for many pages use Crawl, and for a structured data pull across several known URLs use Extract Structured Data. Optionally runs browser actions (click, type, wait, screenshot) before scraping. Read-only against the target, so repeating the same call is safe.', idempotent: true },
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The page to read.',
      placeholder: 'https://example.com/pricing',
      required: true,
    }),
    useActions: Property.Checkbox({
      displayName: 'Run Browser Actions',
      description: 'Click, type or wait on the page before it is read.',
      required: false,
      defaultValue: false,
    }),
    actionProperties: Property.DynamicProperties({
      displayName: 'Action Properties',
      description: 'Properties for actions that will be performed on the page.',
      required: false,
      refreshers: ['useActions'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const useActions = propsValue['useActions'] as unknown as boolean;
        
        if (!useActions) {
          return {};
        }
        
        return {
          actions: Property.Json({
            displayName: 'Actions',
            description: 'Steps run in order. Replace the example with your own.',
            required: false,
            defaultValue: [
              {
                type: 'wait',
                selector: '#example'
              },
              {
                type: 'write',
                selector: '#input',
                text: 'Hello World',
              },
              {
                type: 'click',
                selector: '#button',
              },
              {
                type: 'screenshot',
              },
              {
                type: 'pdf',
                format: 'A4',
              },
            ],
          }),
        };
      },
    }),
    screenshot_note: Property.MarkDown({
      value: 'A full-page screenshot is also saved with every scrape.',
      variant: MarkdownVariant.INFO,
    }),
    formats: Property.Dropdown({
      auth: firecrawlAuth,
      displayName: 'Output Format',
      description: 'What the step returns for the page.',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          options: [
            { label: 'Markdown', value: 'markdown' },
            { label: 'Summary', value: 'summary' },
            { label: 'HTML', value: 'html' },
            { label: 'Raw HTML', value: 'rawHtml' },
            { label: 'Links', value: 'links' },
            { label: 'Images', value: 'images' },
            { label: 'Screenshot', value: 'screenshot' },
            { label: 'JSON', value: 'json' },
          ]
        };
      },
      defaultValue: 'markdown',
    }),
    extractPrompt: Property.DynamicProperties({
      displayName: 'Extraction Prompt',
      description: 'Prompt for extracting data.',
      required: false,
      refreshers: ['formats'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        const map: InputPropertyMap = {
          prompt: Property.LongText({
            displayName: 'Extraction Prompt',
            description: 'What to pull from the page, in plain words.',
            required: false,
            defaultValue: 'Extract the following data from the provided text.',
          }),
        };
        return map;
      },
    }),

    extractMode: Property.DynamicProperties({
      displayName: 'Schema Mode',
      description: 'Data schema type.',
      required: false,
      refreshers: ['formats'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        return {
          mode: Property.StaticDropdown<'simple' | 'advanced'>({
            displayName: 'Data Schema Type',
            required: true,
            defaultValue: 'simple',
            display: 'cards',
            options: {
              disabled: false,
              options: [
                { label: 'Simple', value: 'simple', description: 'A list of fields', icon: 'text' },
                { label: 'Advanced', value: 'advanced', description: 'A JSON Schema', icon: 'code' },
              ],
            },
          }),
        };
      },
    }),
    extractSchema: Property.DynamicProperties({
      displayName: 'Data Definition',
      required: false,
      refreshers: ['formats', 'extractMode'],
      auth: firecrawlAuth,
      props: async (propsValue): Promise<InputPropertyMap> => {
        const mode = (propsValue['extractMode'] as unknown as { mode: 'simple' | 'advanced' })?.mode;
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {}; 
        }

        if (mode === 'advanced') {
          return {
            fields: Property.Json({
              displayName: 'JSON Schema',
              description: 'The shape of the data to return, as a JSON Schema.',
              required: true,
              defaultValue: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  age: {
                    type: 'number',
                  },
                },
                required: ['name'],
              },
            }),
          };
        }
        return {
          fields: Property.Array({
            displayName: 'Fields to Extract',
            description: 'One row per value to pull from the page.',
            required: true,
            properties: {
              name: Property.ShortText({
                displayName: 'Name',
                description: 'Letters, numbers, _ . or - only.',
                placeholder: 'price',
                required: true,
              }),
              description: Property.LongText({
                displayName: 'Description',
                description: 'What the value is, as a hint for the AI.',
                required: false,
              }),
              type: Property.StaticDropdown({
                displayName: 'Data Type',
                required: true,
                defaultValue: 'string',
                options: {
                  disabled: false,
                  options: [
                    { label: 'Text', value: 'string' },
                    { label: 'Number', value: 'number' },
                    { label: 'Boolean', value: 'boolean' },
                  ],
                },
              }),
              isRequired: Property.Checkbox({
                displayName: 'Required Field',
                description: 'The AI must return a value for this field.',
                required: true,
                defaultValue: false,
              }),
            },
          }),
        };
      },
    }),
    timeout: Property.Number({
      displayName: 'Timeout',
      description: 'Milliseconds to wait for the page to load.',
      required: false,
      defaultValue: 60000,
      advanced: true,
    }),
    storeInCache: Property.Checkbox({
      displayName: 'Use Cache',
      description: 'On: Firecrawl keeps the page and may serve a cached copy.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  propertyGroups: [
    { key: 'page', display: 'section', label: 'Page', icon: 'file', props: ['url', 'useActions', 'actionProperties'] },
    { key: 'output', display: 'section', label: 'Output', icon: 'code', props: ['screenshot_note', 'formats', 'extractPrompt', 'extractMode', 'extractSchema'] },
  ],
  async run(context) {
    const { auth, propsValue } = context;
    const shouldStoreInCache = propsValue.storeInCache ?? false;
    const body: Record<string, any> = {
      url: propsValue.url,
      origin: FIRECRAWL_ORIGIN,
      timeout: propsValue.timeout,
      storeInCache: shouldStoreInCache,
    };

    if (!shouldStoreInCache) {
      body['maxAge'] = 0;
    }

    if (propsValue.useActions && propsValue.actionProperties && propsValue.actionProperties['actions']) {
      body['actions'] = propsValue.actionProperties['actions'] || [];
    }

    const format = propsValue.formats as string;
    const formatsArray: Array<string | Record<string, unknown>> = [];

    // user selection
    if (format === 'screenshot') {
      const screenshotFormat = forScreenshotOutputFormat();
      formatsArray.push(screenshotFormat);
    } else if (format === 'json') {
      const extractConfig = {
        prompt: propsValue.extractPrompt?.['prompt'],
        mode: propsValue.extractMode?.['mode'],
        schema: propsValue.extractSchema
      };
      const jsonFormat = forJsonOutputFormat(extractConfig);
      formatsArray.push({
        type: 'json',
        prompt: jsonFormat.prompt,
        schema: jsonFormat.schema
      });
    } else {
      const simpleFormat = forSimpleOutputFormat(format);
      formatsArray.push(simpleFormat);
    }

    if (format !== 'screenshot') {
      const defaultScreenshot = forDefaultScreenshot();
      formatsArray.push(defaultScreenshot);
    }
    body['formats'] = formatsArray;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${FIRECRAWL_API_BASE_URL}/scrape`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth.secret_text}`,
      },
      body: body,
    });

    const result = response.body;
    if (!result?.data) {
      throw new Error(`Firecrawl returned no page data${result?.error ? `: ${result.error}` : ''}`);
    }
    const savedScreenshot = result.data.screenshot
      ? await saveFirecrawlFile({ context, firecrawlFileUrl: result.data.screenshot })
      : undefined;
    const savedPdfs = await Promise.all(
      (result.data.actions?.pdfs ?? []).map((pdfUrl: string) =>
        saveFirecrawlFile({ context, firecrawlFileUrl: pdfUrl })
      )
    );
    const savedActionScreenshots = await Promise.all(
      (result.data.actions?.screenshots ?? []).map((screenshotUrl: string) =>
        saveFirecrawlFile({ context, firecrawlFileUrl: screenshotUrl })
      )
    );
    const javascriptReturns = result.data.actions?.javascriptReturns ?? [];
    const scrapes = result.data.actions?.scrapes ?? [];

    const output: { success: boolean; data: Record<string, unknown> } = {
      success: result.success,
      data: {
        screenshot: savedScreenshot,
        actions: {
          pdfs: savedPdfs,
          screenshots: savedActionScreenshots,
          javascriptReturns,
          scrapes,
        },
        metadata: result.data.metadata,
        warning: result.data.warning,
      },
    };

    if (format !== 'screenshot') {
      output.data[format] = result.data[format];
    }

    return output;
  },
});
