
import {
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import Ajv from 'ajv';

export const firecrawl_api_base_url = 'https://api.firecrawl.dev/v2';

export const forScreenshotOutputFormat = (): any => {
  // initially i gave the user the option to choose viewport or full page, 
  // i decided to just set it as fullpage because fullpage will have more context and info of the website
  return {
    type: 'screenshot',
    fullPage: true
  };
}

export const forSimpleOutputFormat = (format: string): string => {
  return format;
}

// Download and save screenshot(s) - works for both single scrape and crawl results
export async function downloadAndSaveScreenshot(screenshotTarget: any, context: any): Promise<void> {
  const screenshotUrl = screenshotTarget.screenshot;
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: screenshotUrl,
    responseType: 'arraybuffer'
  });

  const fileName = `screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

  const fileUrl = await context.files.write({
    fileName: fileName,
    data: Buffer.from(response.body),
  });

  screenshotTarget.screenshot = {
    fileName: fileName,
    fileUrl: fileUrl,
  };
}

export async function downloadAndSaveCrawlScreenshots(crawlResult: any, context: any): Promise<void> {

  if (!crawlResult.data || !Array.isArray(crawlResult.data)) {
    return;
  }

  for (const data of crawlResult.data) {
    if (data.screenshot) {
      try {
        await downloadAndSaveScreenshot(data, context);
      } catch (error) {
        console.error(`Failed to download screenshot for page: ${error}`);
      }
    }
  }
}

// scrape, extract and crawl uses this function
export function forJsonOutputFormat(jsonExtractionConfig: any): any {

  if (!jsonExtractionConfig['schema']){
    throw new Error('schema is required.')
  }

  // follow logic from utility ai- extract structured data
  let schemaDefinition: any;

  if (jsonExtractionConfig['mode'] === 'advanced'){
    const ajv = new Ajv();
    let schema = jsonExtractionConfig['schema']['fields'];
    const isValidSchema = ajv.validateSchema(schema);

    if (!isValidSchema) {
      throw new Error(
        JSON.stringify({
          message: 'Invalid JSON schema',
          errors: ajv.errors,
        }),
      );
    }

    schemaDefinition = schema;
  } else {
    const fields = jsonExtractionConfig['schema']['fields'] as Array<{
      name: string,
      description?: string;
      type: string;
      isRequired: boolean;
    }>;

    const properties: Record<string, unknown> = {};
    const required: string[] =[];

    fields.forEach((field) => {
      if (!/^[a-zA-Z0-9_.-]+$/.test(field.name)) {
        throw new Error(`Invalid field name: ${field.name}. Field names can only contain letters, numbers, underscores, dots and hyphens.`);
      }

      properties[field.name] = {
        type: field.type,
        description: field.description,
      };

      if (field.isRequired) {
        required.push(field.name);
      }
    });

    schemaDefinition = {
      type: 'object' as const,
      properties,
      required,
    };
  }

  const result: any = {
    schema: schemaDefinition,
  };

  // include prompt if it's provided (applicable for scrape/extract, not for crawl)
  if (jsonExtractionConfig['prompt']) {
    result.prompt = jsonExtractionConfig['prompt'];
  }

  return result;
}

// extract and scrape uses this function
export async function polling(
  jobId: string,
  auth: string,
  timeoutSeconds: number,
  actionType: 'extract' | 'crawl'
): Promise<any> {
  const maxAttempts = timeoutSeconds / 5;

  for (let attempt = 1; attempt <= maxAttempts ; attempt++) {
    // wait 5 seconds before checking
    await new Promise(resolve => setTimeout(resolve, 5000));

    // check status
    const statusResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${firecrawl_api_base_url}/${actionType}/${jobId}`,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
    });

    const jobStatus = statusResponse.body.status;
    if (jobStatus === 'completed') {
      return statusResponse.body;
    } else if (jobStatus === 'failed') {
        throw new Error(`${actionType.charAt(0).toUpperCase()}. job failed: ${JSON.stringify(statusResponse.body)}`);
    }
  }

  // exit loop. time out
  throw new Error(`${actionType.charAt(0).toUpperCase()}. job timed out after ${timeoutSeconds} second(s)`);
}