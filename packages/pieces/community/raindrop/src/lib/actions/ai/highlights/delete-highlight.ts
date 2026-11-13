import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropDeleteHighlightOutputSchema } from '../../../output-schemas';

export const raindropDeleteHighlightAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_highlight',
  outputSchema: raindropDeleteHighlightOutputSchema,
  displayName: 'Delete Highlight',
  description: 'Removes a highlight from a bookmark.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one highlight from a bookmark; the bookmark itself stays. Needs the bookmark ID and the highlight ID, both from List Highlights (raindropRef and _id). Repeating the call leaves the bookmark unchanged.',
    idempotent: true,
  },
  props: {
    raindropId: raindropAiProps.raindropId({
      required: true,
      description: 'ID of the bookmark the highlight is on: raindropRef from List Highlights.',
    }),
    highlightId: Property.ShortText({
      displayName: 'Highlight ID',
      description: 'Highlight _id from List Highlights, e.g. "62388e9e48b63606f41e44a6".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropDeleteHighlightResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
      body: {
        highlights: [{ _id: propsValue.highlightId, text: '' }],
      },
    });
  },
});

type RaindropDeleteHighlightResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
