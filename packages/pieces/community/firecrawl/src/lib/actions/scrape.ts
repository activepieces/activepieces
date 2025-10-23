import { createAction, Property, DynamicPropsValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { firecrawlAuth } from '../../index';
import { Metadata } from '@activepieces/shared';

function forScreenshotOutputFormat(screenshotOptions: any): any {
  let fullPage = true;

  if (screenshotOptions['fullPage'] === false) {
    fullPage = false;
  }

  return {
    type: 'screenshot',
    fullPage: fullPage,
  };
}

function forJsonOutputFormat(jsonExtractionType: any, jsonExtractionConfig: any): any {
  if (!jsonExtractionType || !jsonExtractionType['type']) {
    return 'json';
  }

  const extractionType = jsonExtractionType['type'] as string;

  if (extractionType === 'schema') {
    if (jsonExtractionConfig && jsonExtractionConfig['schema']) {
      return {
        type: 'json',
        schema: jsonExtractionConfig['schema'],
      };
    }
  } else if (extractionType === 'prompt') {
    if (jsonExtractionConfig && jsonExtractionConfig['prompt']) {
      return {
        type: 'json',
        prompt: jsonExtractionConfig['prompt'],
      };
    }
  }

  return 'json';
}

function forSimpleOutputFormat(format: string): string {
  return format;
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}

// screenshot always included in output so that user can pass it into a google drive and keep track of what is being scraped
function forDefaultScreenshot(): any {
  return {
    type: 'screenshot',
    fullPage: true,
  };
}

// function to download screenshot and save as file
async function downloadAndSaveScreenshot(result: any, context: any): Promise<void> {
  const screenshotUrl = result.data.screenshot;

  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: screenshotUrl,
    responseType: 'arraybuffer'
  });

  const fileName = `screenshot-${Date.now()}.png`;

  const fileUrl = await context.files.write({
    fileName: fileName,
    data: Buffer.from(response.body),
  });

  // replace the screenshot url with the saved file info
  result.data.screenshot = {
    fileName: fileName,
    fileUrl: fileUrl,
  };
}

export const scrape = createAction({
  auth: firecrawlAuth,
  name: 'scrape',
  displayName: 'Scrape Website',
  description: 'Scrape a website by performing a series of actions like clicking, typing, taking screenshots, and extracting data.',
  props: {
    url: Property.ShortText({
      displayName: 'Website URL',
      description: 'The webpage URL to scrape.',
      required: true,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (ms)',
      description: 'Maximum time to wait for the page to load (in milliseconds).',
      required: false,
      defaultValue: 60000,
    }),
    useActions: Property.Checkbox({
      displayName: 'Perform Actions Before Scraping',
      description: 'Enable to perform a sequence of actions on the page before scraping (like clicking buttons, filling forms, etc.). See [Firecrawl Actions Documentation](https://docs.firecrawl.dev/api-reference/endpoint/scrape#body-actions) for details on available actions and their parameters.',
      required: false,
      defaultValue: false,
    }),
    actionProperties: Property.DynamicProperties({
      displayName: 'Action Properties',
      description: 'Properties for actions that will be performed on the page.',
      required: false,
      refreshers: ['useActions'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const useActions = propsValue['useActions'] as unknown as boolean;
        
        if (!useActions) {
          return {};
        }
        
        return {
          actions: Property.Json({
            displayName: 'Actions',
            description: 'Sequence of actions to perform on the page.',
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
            ],
          }),
        };
      },
    }),
    formats: Property.Dropdown({
      displayName: 'Output Format',
      description: 'Choose what format you want your output in.',
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
            { label: 'JSON', value: 'json' }
          ]
        };
      },
      defaultValue: 'markdown',
    }),
    screenshotOptions: Property.DynamicProperties({
      displayName: 'Screenshot Options',
      description: 'Configure screenshot capture settings.',
      required: false,
      refreshers: ['formats'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        // Only show if 'screenshot' is selected
        if (format !== 'screenshot') {
          return {};
        }

        return {
          fullPage: Property.Checkbox({
            displayName: 'Full Page Screenshot',
            description: 'Capture the entire page (true) or just the viewport (false).',
            required: false,
            defaultValue: true,
          }),
        };
      },
    }),
    jsonExtractionType: Property.DynamicProperties({
      displayName: 'JSON Extraction Type',
      description: 'Choose how to extract JSON data.',
      required: false,
      refreshers: ['formats'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        return {
          type: Property.StaticDropdown({
            displayName: 'Extraction Type',
            description: 'Choose how to extract JSON data.',
            required: true,
            options: {
              options: [
                { label: 'Schema', value: 'schema' },
                { label: 'Prompt', value: 'prompt' }
              ]
            },
            defaultValue: 'schema',
          }),
        };
      },
    }),
    jsonExtractionConfig: Property.DynamicProperties({
      displayName: 'JSON Extraction Config',
      description: 'Configure JSON extraction.',
      required: false,
      refreshers: ['formats', 'jsonExtractionType'],
      props: async (propsValue: Record<string, DynamicPropsValue>): Promise<InputPropertyMap> => {
        const format = propsValue['formats'] as unknown as string;

        if (format !== 'json') {
          return {};
        }

        const jsonExtractionType = propsValue['jsonExtractionType'] as Record<string, any>;

        if (!jsonExtractionType || !jsonExtractionType['type']) {
          return {};
        }

        const extractionType = jsonExtractionType['type'] as string;

        if (extractionType === 'schema') {
          return {
            schema: Property.Json({
              displayName: 'JSON Schema',
              description: 'JSON schema defining the structure of data to extract.',
              required: true,
              defaultValue: {
                "type": "object",
                "properties": {
                  "company_name": {"type": "string"},
                  "pricing_tiers": {"type": "array", "items": {"type": "string"}},
                  "has_free_tier": {"type": "boolean"}
                }
              },
            }),
          };
        }

        if (extractionType === 'prompt') {
          return {
            prompt: Property.LongText({
              displayName: 'JSON Prompt',
              description: 'Describe what information you want to extract in natural language.',
              required: true,
              defaultValue: 'Extract the main product information including name, price, and description.',
            }),
          };
        }

        return {};
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const body: Record<string, any> = {
      url: propsValue.url,
      timeout: propsValue.timeout,
    };
    
    // add actions to body object if user selected it
    if (propsValue.useActions && propsValue.actionProperties && propsValue.actionProperties['actions']) {
      body['actions'] = propsValue.actionProperties['actions'] || [];
    }

    // prep to pass into firecrawl
    const format = propsValue.formats as string;
    const formatsArray: any[] = [];

    // add parser to body object if pdf is detected
    if (isPdfUrl(propsValue.url)){
      body['parsers'] = ["pdf"];
      formatsArray.push('markdown');
      body['formats'] = formatsArray;
    } else {
      // user selection
      if (format === 'screenshot') {
        const screenshotFormat = forScreenshotOutputFormat(propsValue.screenshotOptions);
        formatsArray.push(screenshotFormat);
      } else if (format === 'json') {
        const jsonFormat = forJsonOutputFormat(propsValue.jsonExtractionType, propsValue.jsonExtractionConfig);
        formatsArray.push(jsonFormat);
      } else {
        const simpleFormat = forSimpleOutputFormat(format);
        formatsArray.push(simpleFormat);
      }

      if (format !== 'screenshot') {
        const defaultScreenshot = forDefaultScreenshot();
        formatsArray.push(defaultScreenshot);
      }

      body['formats'] = formatsArray;
    }
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.firecrawl.dev/v2/scrape',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth}`,
      },
      body: body,
    });

    const result = response.body;

    if (isPdfUrl(propsValue.url)) {
      // pdfs only have markdown, no screenshot
      result.data = {
        note_to_user: "pdf detected. we only support markdown output format for pdfs.",
        markdown: result.data.markdown,
        metadata: result.data.metadata,
      }
    } else {
      await downloadAndSaveScreenshot(result, context);
      // reorder the data object to put screenshot first, then user's selected format only
      result.data = {
        screenshot: result.data.screenshot,
        [format]: result.data[format],
        metadata: result.data.metadata
      };
    }
    return result;
  },
}); 