import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetShareOutputSchema } from '../../../output-schemas';

export const getShareAction = createAction({
  auth: podioAuth,
  name: 'podio_get_share',
  outputSchema: podioGetShareOutputSchema,
  displayName: 'Get Share',
  description: 'Gets one app market share with its comments and ratings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio app market share (an app or pack): description, categories, author, children, comments and ratings. The share id comes from Get Top Shares, Get Shares By Category, Get Shares By Author, Get Own Shares or Get Share By Reference.',
    idempotent: true,
  },
  props: {
    shareId: podioAiProps.id({ required: true, displayName: 'Share ID', description: 'The id of the app market share, from Get Share By Reference, Get Own Shares or another share list.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getShare({ auth, shareId: propsValue.shareId });
  },
});
