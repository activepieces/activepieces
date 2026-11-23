import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoItemResponse, TinkoTag, tinkoClient } from '../common/client';
import { tinkoOutput } from '../common/output';

export const createTagAction = createAction({
  auth: tinkoAuth,
  name: 'create_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Creates a new tag to organize contacts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new contact tag in Tinko with an optional emoji and color. Use it before Add Tag to Contact when the tag does not exist yet. Each call creates a new tag, so retries may duplicate it.',
    idempotent: false,
  },
  props: {
    text: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the tag, for example VIP Customer.',
      required: true,
    }),
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'Emoji shown next to the tag name, for example ⭐.',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'Color of the tag as a six digit hex code, for example #27D366.',
      required: false,
    }),
  },
  async run(context) {
    const { text, emoji, color } = context.propsValue;
    const response = await tinkoClient.request<TinkoItemResponse<TinkoTag>>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/tags',
      body: {
        text,
        ...(emoji ? { emoji } : {}),
        ...(color ? { color: normalizeColor(color) } : {}),
      },
    });
    if (!response.data) {
      throw new Error('Tinko did not return the created tag');
    }
    return tinkoOutput.tag(response.data);
  },
});

function normalizeColor(value: string): string {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}
