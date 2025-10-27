
import {
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import Ajv from 'ajv';


export const forScreenshotOutputFormat = (screenshotOptions: any): any => {
  let fullPage = true;

  if (screenshotOptions['fullPage'] === false) {
    fullPage = false;
  }

  return {
    type: 'screenshot',
    fullPage: fullPage,
  };
}

export const forSimpleOutputFormat = (format: string): string => {
  return format;
}

export async function downloadAndSaveScreenshot(result: any, context: any): Promise<void> {
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

  return {
    prompt: jsonExtractionConfig['prompt'],
    schema: schemaDefinition,
  }
}

export async function polling(
  jobId: string,
  auth: string,
  timeoutSeconds: number
): Promise<any> {
  const maxAttempts = timeoutSeconds / 5;

  for (let attempt = 1; attempt <= maxAttempts ; attempt++) {
    // wait 5 seconds before checking 
    await new Promise(resolve => setTimeout(resolve, 5000));

    // check status
    const statusResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.firecrawl.dev/v2/extract/${jobId}`,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
    });

    const jobStatus = statusResponse.body.status;
    if (jobStatus === 'completed') {
      return statusResponse.body;
    } else if (jobStatus === 'failed') {
        throw new Error(`Extract job failed: ${JSON.stringify(statusResponse.body)}`);
    }
  }

  // exit loop. time out
  throw new Error(`Extract job timed out after ${timeoutSeconds} second(s)`);
}