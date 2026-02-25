import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { canvaAuth } from '../../index';
import { CANVA_BASE_URL, canvaApiRequest } from '../common';

const SUPPORTED_IMPORT_MIME_TYPES: Record<string, string> = {
  ai: 'application/illustrator',
  psd: 'image/vnd.adobe.photoshop',
  key: 'application/vnd.apple.keynote',
  numbers: 'application/vnd.apple.numbers',
  pages: 'application/vnd.apple.pages',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odp: 'application/vnd.oasis.opendocument.presentation',
  odt: 'application/vnd.oasis.opendocument.text',
  pdf: 'application/pdf',
};

interface ImportJob {
  id: string;
  status: 'failed' | 'in_progress' | 'success';
  result?: { design: { id: string } };
  error?: { code: string; message: string };
}

async function pollImportJob(accessToken: string, jobId: string): Promise<ImportJob> {
  const maxAttempts = 20;
  const delayMs = 3000;

  for (let i = 0; i < maxAttempts; i++) {
    const response = await canvaApiRequest<{ job: ImportJob }>(
      accessToken,
      HttpMethod.GET,
      `/imports/${jobId}`,
    );

    if (response.job.status !== 'in_progress') {
      return response.job;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new Error('Import job timed out. Check Canva for the import status.');
}

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design',
  description: 'Import an external file (PDF, PPTX, DOCX, PSD, AI, etc.) into Canva as a new design.',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, AI, PSD, KEY, ODT, ODP, Pages, Numbers.',
      required: true,
    }),
    designTitle: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design.',
      required: true,
    }),
  },
  async run(context) {
    const { file, designTitle } = context.propsValue;

    const ext = file.filename?.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = SUPPORTED_IMPORT_MIME_TYPES[ext];
    if (!mimeType) {
      throw new Error(
        `Unsupported file format: "${ext}". Supported: ${Object.keys(SUPPORTED_IMPORT_MIME_TYPES).join(', ')}.`,
      );
    }

    const fileBuffer = Buffer.from(file.base64, 'base64');
    const titleBase64 = Buffer.from(designTitle.trim()).toString('base64');

    const response = await httpClient.sendRequest<{ job: ImportJob }>({
      method: HttpMethod.POST,
      url: `${CANVA_BASE_URL}/imports`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Content-Type': 'application/octet-stream',
        'Import-Metadata': JSON.stringify({ title_base64: titleBase64, mime_type: mimeType }),
      },
      body: fileBuffer,
    });

    const job = response.body.job;
    if (job.status === 'failed') {
      throw new Error(`Import failed: ${job.error?.message ?? 'Unknown error'}`);
    }

    if (job.status === 'in_progress') {
      const finalJob = await pollImportJob(context.auth.access_token, job.id);
      if (finalJob.status === 'failed') {
        throw new Error(`Import failed: ${finalJob.error?.message ?? 'Unknown error'}`);
      }
      return finalJob;
    }

    return job;
  },
});
