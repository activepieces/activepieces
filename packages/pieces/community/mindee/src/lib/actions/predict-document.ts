import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createReadStream } from 'fs';
import FormData from 'form-data';
import { mindeeAuth } from '../..';

export const mindeePredictDocumentAction = createAction({
  auth: mindeeAuth,
  name: 'mindee_predict_document',
  displayName: 'Extract Document',
  description: 'Parse details of a document using OCR.',
  props: {
    model_id: Property.ShortText({
      displayName: 'Model ID',
      description: 'The Mindee Model ID to use for the inference.',
      required: true,
    }),
    file: Property.LongText({
      displayName: 'File URL',
      description:
        'Remote file URL or Base64 string. We currently support .pdf (slower), .jpg, .png, .webp, .tiff and .heic formats',
      required: true,
    }),
    webhook_ids: Property.LongText({
      displayName: 'Webhook IDs (comma separated)',
      description: 'Optional: Comma separated list of webhook UUIDs to call after processing.',
      required: false,
    }),
    rag: Property.Checkbox({
      displayName: 'Enable RAG (Retrieval-Augmented Generation)',
      description: 'Optional: Activate Retrieval-Augmented Generation.',
      required: false,
      defaultValue: false,
    }),
    alias: Property.ShortText({
      displayName: 'Alias',
      description: 'Optional: Use an alias to link the file to your own DB.',
      required: false,
    }),
  },
  run: async ({ auth, propsValue: { model_id, file, webhook_ids, rag, alias } }) => {
    let headers,
      body = {};

    try {
      const form = new FormData();
      if (["https:", "http:"].includes(new URL(file).protocol))
        form.append("file", await getRemoteFile(file), { filename: 'upload' });
      else form.append("file", createReadStream(file));
      form.append("model_id", model_id);
      if (webhook_ids) {
        // API expects an array of UUIDs
        const ids = webhook_ids.split(',').map((id: string) => id.trim()).filter(Boolean);
        for (const id of ids) form.append('webhook_ids', id);
      }
      if (rag) form.append('rag', 'true');
      if (alias) form.append('alias', alias);
      body = form;
      headers = { ...form.getHeaders() };
    } catch (_) {
      // fallback to JSON (not recommended for file upload)
      body = { model_id, file, webhook_ids: webhook_ids ? webhook_ids.split(',').map((id: string) => id.trim()) : undefined, rag, alias };
      headers = { 'Content-Type': 'application/json' };
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-v2.mindee.net/v2/inferences/enqueue`,
      headers: {
        Authorization: `${auth as string}`,
        ...headers,
      },
      body: body,
    });

    return response.body;
  },
});

async function getRemoteFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
