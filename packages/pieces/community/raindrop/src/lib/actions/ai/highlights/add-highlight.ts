import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropAddHighlightOutputSchema } from '../../../output-schemas';

export const raindropAddHighlightAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_add_highlight',
  outputSchema: raindropAddHighlightOutputSchema,
  displayName: 'Add Highlight',
  description: 'Adds a highlighted quote to a bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Adds one highlight (a quoted passage) to a bookmark, with an optional color (yellow by default). Not idempotent: each call adds another highlight, even with the same text. The new highlight ID is in the returned bookmark's highlights list; use Update Highlight to change an existing one.",
    idempotent: false,
  },
  props: {
    raindropId: raindropAiProps.raindropId({ required: true }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The highlighted passage, e.g. "Some quote".',
      required: true,
    }),
    color: raindropAiProps.highlightColor({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropAddHighlightResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
      body: {
        highlights: [{ text: propsValue.text, color: propsValue.color }],
      },
    });
  },
});

type RaindropAddHighlightResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
