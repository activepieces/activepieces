import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { facebookPagesAuth } from '../../auth';
import { facebookPagesCommon } from '../../common/common';
import { postReactionsOutputSchema } from '../../output-schemas';

const REACTION_TYPES = ['LIKE', 'LOVE', 'CARE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

export const getPostReactionsAction = createAction({
  auth: facebookPagesAuth,
  name: 'get_post_reactions',
  classification: 'READ',
  displayName: 'Get Post Reactions',
  description: 'Counts the reactions on a Facebook Page post.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Count the reactions on a Facebook Page post, either all reactions or only one type such as LOVE or HAHA. Returns the total count only, not the people who reacted. Very new posts can report partial counts. Read-only.',
    idempotent: true,
  },
  outputSchema: postReactionsOutputSchema,
  props: {
    pageId: facebookPagesCommon.pageId,
    objectId: Property.ShortText({
      displayName: 'Post ID',
      description: 'A post ID in PageID_PostID format.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Reaction Type',
      description: 'Only count this reaction type. Leave empty to count all reactions.',
      required: false,
      options: {
        options: REACTION_TYPES.map((type) => ({ label: type, value: type })),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await facebookPagesCommon.pageRequest<{ summary?: { total_count?: number } }>({
      auth,
      pageId: propsValue.pageId,
      method: HttpMethod.GET,
      path: `${facebookPagesCommon.objectPath({ id: propsValue.objectId })}/reactions`,
      queryParams: { summary: 'total_count', limit: '0', type: propsValue.type },
    });
    return {
      object_id: propsValue.objectId.trim(),
      type: propsValue.type ?? 'ALL',
      total_count: response.summary?.total_count ?? 0,
    };
  },
});
