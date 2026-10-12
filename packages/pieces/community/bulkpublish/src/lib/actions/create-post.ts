import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bpRequest, bulkpublishAuth, channelsDropdown } from '../common';

type BpPostResponse = { id?: string | number; post?: { id?: string | number } };

export const createPost = createAction({
  auth: bulkpublishAuth,
  name: 'create_post',
  displayName: 'Create Post',
  description: 'Create a post on one or more channels and publish it now, schedule it, or save it as a draft.',
  props: {
    channels: channelsDropdown(true),
    content: Property.LongText({ displayName: 'Content', description: 'Post text. Optional if media is attached.', required: false }),
    mode: Property.StaticDropdown({
      displayName: 'When',
      required: true,
      defaultValue: 'draft',
      options: {
        options: [
          { label: 'Publish now', value: 'now' },
          { label: 'Schedule', value: 'scheduled' },
          { label: 'Save as draft', value: 'draft' },
        ],
      },
    }),
    scheduledAt: Property.DateTime({ displayName: 'Scheduled At', description: 'Required when "When" is Schedule.', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, e.g. Asia/Karachi. Default UTC.', required: false }),
    mediaFiles: Property.Array({ displayName: 'Media File IDs', description: 'IDs returned by the Upload Media action.', required: false }),
    labels: Property.Array({ displayName: 'Label IDs', required: false }),
    postFormat: Property.StaticDropdown({
      displayName: 'Post Format',
      required: false,
      options: { options: ['post', 'video', 'reel', 'story', 'carousel', 'thread'].map((v) => ({ label: v, value: v })) },
    }),
    platformContent: Property.Json({ displayName: 'Per-platform Content', description: 'Optional, e.g. {"x": "Short text"}', required: false }),
  },
  async run({ auth, propsValue }) {
    const { mode } = propsValue;
    if (mode === 'scheduled' && !propsValue.scheduledAt) {
      throw new Error('Scheduled At is required when scheduling a post.');
    }
    const body: Record<string, unknown> = {
      channels: (propsValue.channels as number[]).map((id) => ({ channelId: Number(id) })),
      status: mode === 'scheduled' ? 'scheduled' : 'draft',
    };
    if (propsValue.content) body['content'] = propsValue.content;
    if (mode === 'scheduled') body['scheduledAt'] = propsValue.scheduledAt;
    if (propsValue.timezone) body['timezone'] = propsValue.timezone;
    if (propsValue.mediaFiles?.length) body['mediaFiles'] = propsValue.mediaFiles.map(Number);
    if (propsValue.labels?.length) body['labels'] = propsValue.labels.map(Number);
    if (propsValue.postFormat) body['postFormat'] = propsValue.postFormat;
    if (propsValue.platformContent) body['platformContent'] = propsValue.platformContent;

    const created = await bpRequest<BpPostResponse>(auth.secret_text, HttpMethod.POST, '/api/posts', body);
    if (mode !== 'now') return created;
    // "Publish now" = create a draft, then POST /api/posts/{id}/publish (the create endpoint has no "now" status).
    const id = created?.id ?? created?.post?.id;
    if (!id) throw new Error('Post was created but no ID was returned, so it could not be published.');
    const published = await bpRequest<BpPostResponse>(auth.secret_text, HttpMethod.POST, `/api/posts/${id}/publish`);
    return { post: created, publish: published };
  },
});
