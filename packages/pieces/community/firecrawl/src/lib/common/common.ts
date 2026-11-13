import {
	httpClient,
	HttpMethod,
} from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import Ajv from 'ajv';
import { randomUUID } from 'crypto';

export const FIRECRAWL_API_BASE_URL = 'https://api.firecrawl.dev/v2';
export const POLLING_INTERVAL = 5000;

export const forScreenshotOutputFormat = (): any => {
  return {
    type: 'screenshot',
    fullPage: true
  };
}

export const forSimpleOutputFormat = (format: string): string => {
  return format;
}

const FILE_EXTENSIONS_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

export async function saveFirecrawlFile({
  context,
  firecrawlFileUrl,
}: {
  context: { files: FilesService };
  firecrawlFileUrl: string;
}): Promise<{ fileName: string; fileUrl: string }> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: firecrawlFileUrl,
    responseType: 'arraybuffer'
  });

  const contentTypeHeader = response.headers?.['content-type'];
  const fileMimetype = typeof contentTypeHeader === 'string' ? contentTypeHeader.split(';')[0].trim().toLowerCase() : '';
  const fileName = `firecrawl-${randomUUID()}.${FILE_EXTENSIONS_BY_MIME_TYPE[fileMimetype] ?? 'bin'}`;
  const fileUrl = await context.files.write({
    fileName: fileName,
    data: Buffer.from(response.body),
  });

  return { fileName, fileUrl };
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
    const schema = jsonExtractionConfig['schema']['fields'];
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
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));

    const statusResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${FIRECRAWL_API_BASE_URL}/${actionType}/${jobId}`,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
    });

    const jobStatus = statusResponse.body.status;
    if (jobStatus === 'completed') {
      return statusResponse.body;
    } else if (jobStatus === 'failed') {
        throw new Error(`${JOB_NAMES[actionType]} job failed: ${JSON.stringify(statusResponse.body)}`);
    }
  }

  // exit loop time out
  throw new Error(`${JOB_NAMES[actionType]} job timed out after ${timeoutSeconds} seconds`);
}

export async function followCrawlPages({
  firstPage,
  auth,
}: {
  firstPage: CrawlStatusPage;
  auth: string;
}): Promise<CrawlStatusPage> {
  let data = firstPage.data ?? [];
  let next = firstPage.next;
  const visited = new Set<string>();
  while (isFirecrawlApiUrl(next) && !visited.has(next)) {
    visited.add(next);
    const response = await httpClient.sendRequest<CrawlStatusPage>({
      method: HttpMethod.GET,
      url: next,
      headers: {
        'Authorization': `Bearer ${auth}`,
      },
    });
    data = [...data, ...(response.body.data ?? [])];
    next = response.body.next;
  }
  return { ...firstPage, data, next: null };
}

function isFirecrawlApiUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.startsWith(`${FIRECRAWL_API_BASE_URL}/`);
}

const JOB_NAMES: Record<'extract' | 'crawl', string> = {
  extract: 'Extract',
  crawl: 'Crawl',
};

export const FIRECRAWL_ORIGIN = 'activepieces';

export type CrawlStatusPage = {
  data?: Record<string, unknown>[];
  next?: string | null;
  [key: string]: unknown;
};
