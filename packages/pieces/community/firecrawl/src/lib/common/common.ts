
import {
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import Ajv from 'ajv';


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

// helper function to download and save a single screenshot
async function downloadSingleScreenshot(screenshotUrl: string, context: any): Promise<{ fileName: string; fileUrl: string }> {
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

  return {
    fileName: fileName,
    fileUrl: fileUrl,
  };
}

export async function downloadAndSaveScreenshot(result: any, context: any): Promise<void> {
  const screenshotUrl = result.data.screenshot;
  const screenshotInfo = await downloadSingleScreenshot(screenshotUrl, context);
  result.data.screenshot = screenshotInfo;
}

export async function downloadAndSaveCrawlScreenshots(crawlResult: any, context: any): Promise<void> {

  if (!crawlResult.data || !Array.isArray(crawlResult.data)) {
    return;
  }

  for (const data of crawlResult.data) {
    if (data.screenshot) {
      const screenshotUrl = data.screenshot;
      const screenshotInfo = await downloadSingleScreenshot(screenshotUrl, context);
      data.screenshot = screenshotInfo;
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
      url: `https://api.firecrawl.dev/v2/${actionType}/${jobId}`,
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