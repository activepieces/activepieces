import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUpdateHighlightOutputSchema } from '../../../output-schemas';

export const raindropUpdateHighlightAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_highlight',
  outputSchema: raindropUpdateHighlightOutputSchema,
  displayName: 'Update Highlight',
  description: 'Changes the text or color of a highlight on a bookmark.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the text and/or color of one existing highlight; fields left empty stay as they are. Needs the bookmark ID and the highlight ID, both from List Highlights (raindropRef and _id). Use Add Highlight for a new one and Delete Highlight to remove one.',
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
    text: Property.LongText({
      displayName: 'Text',
      description: 'New highlighted passage.',
      required: false,
    }),
    color: raindropAiProps.highlightColor({
      required: false,
      description: 'New highlight color.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.text === undefined && propsValue.color === undefined) {
      throw new Error('Set at least one of Text or Color.');
    }
    const response = await raindropClient.request<RaindropUpdateHighlightResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/raindrop/${encodeURIComponent(propsValue.raindropId)}`,
      body: {
        highlights: [
          {
            _id: propsValue.highlightId,
            text: propsValue.text,
            color: propsValue.color,
          },
        ],
      },
    });
    if (!response.item.highlights.some((highlight) => highlight._id === propsValue.highlightId)) {
      throw new Error(
        `Highlight ${propsValue.highlightId} not found on bookmark ${propsValue.raindropId}. Use List Highlights to get its ID.`,
      );
    }
    return response;
  },
});

type RaindropUpdateHighlightResponse = {
  result: boolean;
  item: { highlights: { _id: string }[] } & Record<string, unknown>;
};
