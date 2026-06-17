import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { frillAuth } from '../auth';
import { frillDropdowns, flattenObject, frillApiCall } from '../common';

export const createIdea = createAction({
  auth: frillAuth,
  name: 'create_idea',
  displayName: 'Create Idea',
  description: 'Create a new feedback idea or feature request in Frill.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new feedback idea or feature request in Frill, optionally tagged with topics, a status, a bug flag, and roadmap visibility. Use to capture incoming feedback or seed roadmap items. Not idempotent: each call creates a distinct idea even with identical input.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the idea or feedback.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the idea in Markdown format.',
      required: false,
    }),
    topics: frillDropdowns.topicDropdown,
    status: frillDropdowns.statusDropdown,
    is_bug: Property.Checkbox({
      displayName: 'Mark as Bug',
      description: 'Check if this idea represents a bug.',
      required: false,
      defaultValue: false,
    }),
    show_in_roadmap: Property.Checkbox({
      displayName: 'Show in Roadmap',
      description: 'Display this idea on the public roadmap.',
      required: false,
      defaultValue: true,
    }),
    cover_image: Property.ShortText({
      displayName: 'Cover Image URL',
      description: 'Optional URL for a cover image shown on the roadmap.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      name: context.propsValue.name,
    };
    if (context.propsValue.description) body['description'] = context.propsValue.description;
    if (context.propsValue.topics && context.propsValue.topics.length > 0) body['topics'] = context.propsValue.topics;
    if (context.propsValue.status) body['status'] = context.propsValue.status;
    if (context.propsValue.is_bug !== undefined) body['is_bug'] = context.propsValue.is_bug;
    if (context.propsValue.show_in_roadmap !== undefined) body['show_in_roadmap'] = context.propsValue.show_in_roadmap;
    if (context.propsValue.cover_image) body['cover_image'] = context.propsValue.cover_image;

    const response = await frillApiCall<{ data: Record<string, unknown> }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/ideas',
      body,
    });

    return flattenObject(response.body.data);
  },
});
