import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferAiProps } from '../../common/ai-props';
import { bufferFetch } from '../../common/props';
import { listChannelsOutputSchema } from '../../common/output-schemas';

export const listChannels = createAction({
  auth: bufferAuth,
  name: 'list_channels',
  classification: 'SEARCH',
  displayName: 'List Channels',
  description: 'List the social channels connected to a Buffer organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every social channel (Facebook page, LinkedIn profile, Bluesky account, …) connected to one Buffer organization, with its Channel ID, service, type and whether it is disconnected, locked or has a paused queue. Use it to find the Channel ID for Create a Post, List Posts or Get a Channel; use Get a Channel for the posting schedule or Pinterest boards. Returns all channels in one call. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
  },
  outputSchema: listChannelsOutputSchema,
  async run(context) {
    const organizationId = bufferAiProps.requiredId({ value: context.propsValue.organizationId, label: 'Organization ID' });
    const channels = await bufferFetch.fetchChannels({ accessToken: context.auth.secret_text, organizationId });
    return { channels };
  },
});
