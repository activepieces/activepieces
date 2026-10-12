import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth, channelsDropdown, postIdProp } from '../common';

export const updatePost = createAction({
  auth: bulkpublishAuth,
  name: 'update_post',
  displayName: 'Update Post',
  description: 'Edit a post. Only the fields you fill in are sent. Channels, if given, replace the full channel list.',
  props: {
    postId: postIdProp,
    content: Property.LongText({ displayName: 'Content', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Draft unschedules the post. Scheduled needs a future Scheduled At.',
      required: false,
      options: { options: [{ label: 'Draft', value: 'draft' }, { label: 'Scheduled', value: 'scheduled' }] },
    }),
    scheduledAt: Property.DateTime({ displayName: 'Scheduled At', required: false }),
    channels: channelsDropdown(false),
    mediaFiles: Property.Array({ displayName: 'Media File IDs', required: false }),
    labels: Property.Array({ displayName: 'Label IDs', required: false }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {};
    if (propsValue.content) body['content'] = propsValue.content;
    if (propsValue.status) body['status'] = propsValue.status;
    if (propsValue.scheduledAt) body['scheduledAt'] = propsValue.scheduledAt;
    if (propsValue.channels?.length) body['channels'] = (propsValue.channels as number[]).map((id) => ({ channelId: Number(id) }));
    if (propsValue.mediaFiles?.length) body['mediaFiles'] = propsValue.mediaFiles.map(Number);
    if (propsValue.labels?.length) body['labels'] = propsValue.labels.map(Number);
    return bpRequest(auth.secret_text, HttpMethod.PUT, `/api/posts/${propsValue.postId}`, body);
  },
});
