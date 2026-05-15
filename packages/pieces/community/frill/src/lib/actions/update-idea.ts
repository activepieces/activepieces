import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { frillAuth } from '../../';
import { frillDropdowns, flattenObject } from '../common';

export const updateIdea = createAction({
  auth: frillAuth,
  name: 'update_idea',
  displayName: 'Update Idea',
  description: 'Update an existing idea, including status, topics, or archive flag.',
  props: {
    idea: frillDropdowns.ideaDropdown,
    name: Property.ShortText({
      displayName: 'Title',
      description: 'New title for the idea. Leave empty to keep unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description in Markdown. Leave empty to keep unchanged.',
      required: false,
    }),
    status: frillDropdowns.statusDropdown,
    topics: frillDropdowns.topicDropdown,
    is_bug: Property.Checkbox({
      displayName: 'Mark as Bug',
      description: 'Check to mark this idea as a bug. Leave empty to keep unchanged.',
      required: false,
    }),
    is_archived: Property.Checkbox({
      displayName: 'Archive',
      description: 'Check to archive this idea. Leave empty to keep unchanged.',
      required: false,
    }),
    is_completed: Property.Checkbox({
      displayName: 'Mark Completed',
      description: 'Check to mark this idea as completed. Leave empty to keep unchanged.',
      required: false,
    }),
    show_in_roadmap: Property.Checkbox({
      displayName: 'Show in Roadmap',
      description: 'Display this idea on the public roadmap. Leave empty to keep unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {};
    if (context.propsValue.name) body.name = context.propsValue.name;
    if (context.propsValue.description) body.description = context.propsValue.description;
    if (context.propsValue.status) body.status = context.propsValue.status;
    if (context.propsValue.topics && context.propsValue.topics.length > 0) body.topics = context.propsValue.topics;
    if (context.propsValue.is_bug !== undefined) body.is_bug = context.propsValue.is_bug;
    if (context.propsValue.is_archived !== undefined) body.is_archived = context.propsValue.is_archived;
    if (context.propsValue.is_completed !== undefined) body.is_completed = context.propsValue.is_completed;
    if (context.propsValue.show_in_roadmap !== undefined) body.show_in_roadmap = context.propsValue.show_in_roadmap;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `https://api.frill.co/v1/ideas/${context.propsValue.idea}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      body,
    });

    return flattenObject(response.body);
  },
});
