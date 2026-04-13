import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedhiveAuth } from '../../';
import { feedhiveCommon } from '../common';

export const updatePostAction = createAction({
  auth: feedhiveAuth,
  name: 'update_post',
  displayName: 'Update Post',
  description: 'Updates an existing post in FeedHive. Only the fields you fill in will be changed.',
  props: {
    post_id: feedhiveCommon.postDropdown,
    text: Property.LongText({
      displayName: 'Post Text',
      description: 'The new content of the post. Leave empty to keep the current text.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Change the post status. Leave empty to keep the current status.',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
        ],
      },
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Scheduled Date & Time',
      description: 'Update the scheduled publish date and time.',
      required: false,
    }),
    accounts: feedhiveCommon.socialsMultiDropdown,
    labels: feedhiveCommon.labelsMultiDropdown,
    notes: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Update the private notes for this post.',
      required: false,
    }),
    short_link_enabled: Property.Checkbox({
      displayName: 'Enable Short Links',
      description: 'Automatically shorten URLs in the post text.',
      required: false,
    }),
  },
  async run(context) {
    const { post_id, text, status, scheduled_at, accounts, labels, notes, short_link_enabled } =
      context.propsValue;

    const body: Record<string, unknown> = {};
    if (text) body['text'] = text;
    if (status) body['status'] = status;
    if (scheduled_at) body['scheduled_at'] = scheduled_at;
    if (accounts && accounts.length > 0) body['accounts'] = accounts;
    if (labels !== undefined) body['labels'] = labels ?? [];
    if (notes) body['notes'] = notes;
    if (short_link_enabled !== undefined && short_link_enabled !== null)
      body['short_link_enabled'] = short_link_enabled;

    const response = await feedhiveCommon.apiCall<{ data: Record<string, unknown> }>({
      token: context.auth as unknown as string,
      method: HttpMethod.PATCH,
      path: `/posts/${post_id}`,
      body,
    });

    return feedhiveCommon.flattenPost(response.body.data);
  },
});
