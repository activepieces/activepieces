import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { mindeeAuth } from '../..';

const MINDEE_API_V2_BASE_URL = 'https://api-v2.mindee.net';
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 45;

export const mindeePredictDocumentV2Action = createAction({
  auth: mindeeAuth,
  name: 'mindee_predict_document_v2',
  displayName: 'Extract Document (V2)',
  description:
    'Send a document to Mindee V2 API, wait for async processing, and return the inference result.',
  props: {
    model_id: Property.ShortText({
      displayName: 'Model ID',
      description:
        'The Mindee V2 model UUID. Find it in your Mindee model settings.',
      required: true,
    }),
    file: Property.LongText({
      displayName: 'File URL or Base64',
      description:
        'A public HTTPS URL or a Base64-encoded string. Supports PDF, JPG, PNG, WEBP, TIFF, and HEIC.',
      required: true,
    }),
    alias: Property.ShortText({
      displayName: 'Alias',
      description: 'Optional alias to link this file to your own records.',
      required: false,
    }),
    confidence: Property.Checkbox({
      displayName: 'Include Confidence Scores',
      description:
        'Include confidence scores for extracted values when available.',
      required: false,
      defaultValue: true,
    }),
    polygon: Property.Checkbox({
      displayName: 'Include Polygons',
      description:
        'Include bounding box polygons in extracted field locations.',
      required: false,
      defaultValue: false,
    }),
    raw_text: Property.Checkbox({
      displayName: 'Include Raw Text',
      description: 'Include raw OCR text in the response.',
      required: false,
      defaultValue: false,
    }),
    text_context: Property.LongText({
      displayName: 'Text Context',
      description:
        'Optional extra context to help the model with this inference.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      model_id,
      file,
      alias,
      confidence,
      polygon,
      raw_text,
      text_context,
    } = propsValue;

    const body: Record<string, unknown> = { model_id };

    if (isHttpUrl(file)) {
      body['url'] = file;
    } else {
      body['file_base64'] = file;
    }

    if (alias) body['alias'] = alias;
    if (confidence !== undefined) body['confidence'] = confidence;
    if (polygon !== undefined) body['polygon'] = polygon;
    if (raw_text !== undefined) body['raw_text'] = raw_text;
    if (text_context) body['text_context'] = text_context;

    const enqueueResponse = await httpClient.sendRequest<{
      job: MindeeJob;
    }>({
      method: HttpMethod.POST,
      url: `${MINDEE_API_V2_BASE_URL}/v2/inferences/enqueue`,
      headers: {
        Authorization: `Token ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const job = enqueueResponse.body?.job;
    if (!job?.polling_url) {
      return enqueueResponse.body;
    }

    const finalJob = await pollInferenceJob(job.polling_url, auth as string);

    if (finalJob.status === 'Failed') {
      throw new Error(
        finalJob.error?.detail ||
          finalJob.error?.title ||
          'Mindee inference failed during processing.'
      );
    }

    if (!finalJob.result_url) {
      return { job: finalJob };
    }

    const resultResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: finalJob.result_url,
      headers: {
        Authorization: `Token ${auth}`,
      },
    });

    return {
      job: finalJob,
      result: resultResponse.body,
    };
  },
});

async function pollInferenceJob(
  pollingUrl: string,
  apiKey: string
): Promise<MindeeJob> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const pollResponse = await httpClient.sendRequest<{ job: MindeeJob }>({
      method: HttpMethod.GET,
      url: pollingUrl,
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    const latestJob = pollResponse.body?.job;
    if (!latestJob) {
      throw new Error(
        'Mindee polling response did not include a job object.'
      );
    }

    if (latestJob.status === 'Processed' || latestJob.status === 'Failed') {
      return latestJob;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Mindee inference did not finish after ${MAX_POLL_ATTEMPTS} polling attempts.`
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MindeeJob = {
  id: string;
  model_id?: string;
  status: 'Pending' | 'Processing' | 'Processed' | 'Failed' | 'Queued';
  polling_url?: string;
  result_url?: string | null;
  error?: {
    detail?: string;
    title?: string;
    code?: string;
  } | null;
};
