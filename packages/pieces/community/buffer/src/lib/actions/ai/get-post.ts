import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferClient } from '../../common/client';
import { bufferAiProps } from '../../common/ai-props';
import { bufferQueries } from '../../common/queries';
import { getPostOutputSchema } from '../../common/output-schemas';

export const getPost = createAction({
  auth: bufferAuth,
  name: 'get_post',
  classification: 'READ',
  displayName: 'Get a Post',
  description: 'Get one Buffer post by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one Buffer post by Post ID: text, status, scheduled and sent times, channel, tags, media, service settings in metadata (the link preview card on Facebook, LinkedIn, Threads, Bluesky and Substack; the YouTube title, privacy and category), the publishing error when status is error, the published link and allowedActions. Use it to check why a post failed or whether it may be edited or deleted. Create a Post, Edit a Post and List Posts already return the same post shape, so skip this call when that data is fresh. Read-only.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The post ID from List Posts or Create a Post.',
      required: true,
    }),
    includeMetrics: bufferAiProps.yesNoDropdown({
      displayName: 'Include Metrics',
      description: 'yes to add this post\'s analytics and when they were last refreshed. Default no.',
    }),
  },
  outputSchema: getPostOutputSchema,
  async run(context) {
    const id = bufferAiProps.requiredId({ value: context.propsValue.postId, label: 'Post ID' });
    const data = await bufferClient.graphql<{ post: Record<string, unknown> }>({
      accessToken: context.auth.secret_text,
      query: bufferQueries.POST,
      variables: { id, withMetrics: bufferAiProps.yes(context.propsValue.includeMetrics) },
      operation: `load post ${id}`,
    });
    return data.post;
  },
});
