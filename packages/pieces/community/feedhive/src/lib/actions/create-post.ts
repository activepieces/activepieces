import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../../';
import { feedhiveCommon } from '../common';

export const createPostAction = createAction({
  auth: feedhiveAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Creates a new post in FeedHive (draft or scheduled).',
  props: {
    text: Property.LongText({
      displayName: 'Post Text',
      description: 'The main content of your post.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Choose "Draft" to save without scheduling, or "Scheduled" to set a publish date.',
      required: true,
      defaultValue: 'draft',
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
        ],
      },
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Scheduled Date & Time',
      description: 'Required when Status is "Scheduled". The exact date and time the post should be published.',
      required: false,
    }),
    accounts: feedhiveCommon.socialsMultiDropdown,
    labels: feedhiveCommon.labelsMultiDropdown,
    notes: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Private notes visible only to your team in FeedHive. Not published.',
      required: false,
    }),
    short_link_enabled: Property.Checkbox({
      displayName: 'Enable Short Links',
      description: 'Automatically shorten URLs in your post text.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { text, status, scheduled_at, accounts, labels, notes, short_link_enabled } =
      context.propsValue;

    const body: Record<string, unknown> = { text, status };
    if (accounts && accounts.length > 0) body['accounts'] = accounts;
    if (labels && labels.length > 0) body['labels'] = labels;
    if (scheduled_at) body['scheduled_at'] = scheduled_at;
    if (notes) body['notes'] = notes;
    if (short_link_enabled !== undefined) body['short_link_enabled'] = short_link_enabled;

    const response = await feedhiveCommon.apiCall<{ data: Record<string, unknown> }>({
      token: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: '/posts',
      body,
    });

    return feedhiveCommon.flattenPost(response.body.data);
  },
});
