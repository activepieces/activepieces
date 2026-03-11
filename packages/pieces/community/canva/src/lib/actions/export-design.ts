import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { CANVA_BASE_URL } from '../common';

// Valid Canva export format types per API docs
// https://www.canva.com/developers/docs/connect/api-reference/exports/create-design-export/
const EXPORT_FORMATS = [
  { label: 'PDF (Print)', value: 'pdf' },
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
  { label: 'SVG', value: 'svg' },
  { label: 'PPTX', value: 'pptx' },
  { label: 'GIF', value: 'gif' },
  { label: 'MP4', value: 'mp4' },
];

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 20; // 60 seconds total

type ExportJobResponse = {
  job: {
    id: string;
    status: 'queued' | 'in_progress' | 'success' | 'failed';
    urls?: string[];
    error?: { code: string; message: string };
  };
};

async function pollExportJob(
  accessToken: string,
  exportId: string
): Promise<ExportJobResponse['job']> {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const pollResponse = await httpClient.sendRequest<ExportJobResponse>({
      method: HttpMethod.GET,
      url: `${CANVA_BASE_URL}/exports/${exportId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const job = pollResponse.body.job;

    if (job.status === 'success') {
      return job;
    }

    if (job.status === 'failed') {
      throw new Error(
        `Export job failed: ${job.error?.message ?? 'unknown error'} (code: ${job.error?.code ?? 'n/a'})`
      );
    }

    // Still queued or in_progress — wait before next poll
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(
    `Export job timed out after ${(MAX_POLL_ATTEMPTS * POLL_INTERVAL_MS) / 1000} seconds.`
  );
}

export const exportDesign = createAction({
  auth: canvaAuth,
  name: 'export_design',
  displayName: 'Export Design',
  description:
    'Export a Canva design to a file (PDF, PNG, MP4, etc.). Waits for the export to complete and returns the download URL(s).',
  props: {
    design_id: Property.ShortText({
      displayName: 'Design ID',
      description: 'The ID of the design to export.',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The file format to export to.',
      required: true,
      options: {
        options: EXPORT_FORMATS,
      },
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const designId = context.propsValue.design_id;
    const formatType = context.propsValue.format;

    // Step 1: Initiate the async export job
    const exportResponse = await httpClient.sendRequest<ExportJobResponse>({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/exports`,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design_id: designId,
        format: {
          type: formatType,
        },
      }),
    });

    const exportId = exportResponse.body.job.id;

    // Step 2: Poll until the job completes (success or failure)
    const completedJob = await pollExportJob(auth.access_token, exportId);

    return {
      job_id: completedJob.id,
      status: completedJob.status,
      urls: completedJob.urls ?? [],
    };
  },
});
