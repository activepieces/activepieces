import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient, carboneOutputFields } from '../common/client';

export const getRenderResultAction = createAction({
  auth: carboneAuth,
  name: 'carbone_get_render_result',
  classification: 'READ',
  displayName: 'Get Render Result',
  description: 'Download a document that Carbone already rendered, using its render ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads a previously generated Carbone document by its render ID (for example the renderId Carbone posted to a webhook after an asynchronous render) and returns it as a file. Carbone keeps a render for 1 hour and lets it be downloaded only once, so a second call with the same render ID fails. Not idempotent for that reason.',
    idempotent: false,
  },
  outputSchema: { fields: carboneOutputFields.file },
  props: {
    renderId: Property.ShortText({
      displayName: 'Render ID',
      required: true,
      description: 'Render ID from Carbone. Expires after 1 hour; downloadable once.',
    }),
  },
  async run(context) {
    const renderId = carboneClient.readId({ value: context.propsValue.renderId, label: 'Render ID' });
    const response = await carboneClient.request<Buffer>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/render/${encodeURIComponent(renderId)}`,
      operation: 'get render result',
      responseType: 'arraybuffer',
      timeoutMs: carboneClient.RENDER_TIMEOUT_MS,
    });
    return carboneClient.saveFileResponse({
      response,
      fallbackName: renderId,
      writeFile: (params) => context.files.write(params),
    });
  },
});
