import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateEmbedOutputSchema } from '../../../output-schemas';

const EMBED_MODES = ['immediate', 'delayed'];

export const createEmbedAction = createAction({
  auth: podioAuth,
  name: 'podio_create_embed',
  outputSchema: podioCreateEmbedOutputSchema,
  displayName: 'Create Embed',
  description: 'Fetches the title, description and thumbnails of a link and stores them as an embed.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Podio embed from a URL: Podio fetches the page title, description, provider and thumbnail files and returns a new embed id. Use it before adding a link to a comment, status or an item\'s link field, which take the embed id.',
    idempotent: false,
  },
  props: {
    url: podioAiProps.text({ required: true, displayName: 'URL', description: 'The absolute URL to fetch metadata for, including the protocol (https://).' }),
    mode: podioAiProps.choice({
      required: false,
      displayName: 'Mode',
      description: '"immediate" fetches the metadata before returning; "delayed" lets Podio fetch it later. Defaults to "immediate".',
      values: EMBED_MODES,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.mode && !EMBED_MODES.includes(propsValue.mode)) {
      throw new Error(`Mode must be one of: ${EMBED_MODES.join(', ')}.`);
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: '/embed/',
      body: podioUtils.body({ values: { url: propsValue.url, mode: propsValue.mode } }),
    });
  },
});
