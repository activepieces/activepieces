import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';

export const listTranscriptsAction = createAction({
  auth: transkriptorAuth,
  name: 'list_transcripts',
  classification: 'READ',
  displayName: 'List Transcripts',
  description: 'Retrieves a list of transcription files in your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists recent transcription files in the connected Transkriptor account, ordered newest-first. Use the limit parameter to control how many are returned. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of transcriptions to return.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${BASE_URL}/files`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {
        limit: String(context.propsValue.limit ?? 10),
      },
    });

    const files = response.body as Array<Record<string, unknown>>;

    return files.map((file) => {
      const { parent_folder_id, ...safeFile } = file;
      return safeFile;
    });
  },
});
