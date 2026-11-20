import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';

export const createPostAction = createAction({
  auth: hermosoAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description:
    'Creates a social post that publishes now, at a set time, or in the next free slot of the brand posting queue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes or schedules one post to one or more social channels connected to the Hermoso brand (Instagram, TikTok, LinkedIn, X and others). Each channel publishes on its own and the result lists each outcome. Each call creates a new post; a retry of the same step in the same flow run returns the first post instead of posting twice.',
    idempotent: false,
  },
  props: {
    brand: hermosoProps.brand,
    channels: hermosoProps.channels,
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'The post text. Hermoso checks each channel length limit before it accepts the post.',
      required: false,
    }),
    media: Property.Array({
      displayName: 'Media',
      description:
        'Public links to images or a video. One item makes a single post; two or more make a carousel in the order given.',
      required: false,
    }),
    timing: Property.StaticDropdown({
      displayName: 'When to Publish',
      description: 'A set time, the next free slot in the brand posting schedule, or right away.',
      required: true,
      defaultValue: 'scheduled',
      options: {
        options: [
          { label: 'At a set time', value: 'scheduled' },
          { label: 'Next free queue slot', value: 'queue' },
          { label: 'Publish now', value: 'now' },
        ],
      },
    }),
    scheduled_at: Property.DateTime({
      displayName: 'Publish Time',
      description: 'Required when When to Publish is "At a set time". It must be at least one minute from now.',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Queue Time Zone',
      description:
        'Only for "Next free queue slot". An IANA time zone such as America/Toronto. Leave empty to use the time zone saved on the brand.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The headline that Pinterest and YouTube ask for. Leave empty and Hermoso writes one from the caption.',
      required: false,
    }),
    link: Property.ShortText({
      displayName: 'Link',
      description: 'A destination link to attach, on channels that support one.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description:
        'Defaults to Public. If a chosen channel cannot honor the setting, Hermoso refuses the post and says why instead of changing it.',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Unlisted', value: 'unlisted' },
          { label: 'Private', value: 'private' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const brand = context.propsValue.brand ?? undefined;
    const timing = context.propsValue.timing;
    const scheduledAt = (context.propsValue.scheduled_at ?? '').trim();
    if (timing === 'scheduled' && !scheduledAt) {
      throw new Error(
        'Publish Time is empty. Set a date and time, or change When to Publish to "Next free queue slot" or "Publish now".'
      );
    }
    const media = await Promise.all(
      hermosoApi.textList(context.propsValue.media).map((url) => hermosoApi.hostedUrl({ apiKey, brand, url }))
    );
    const body = hermosoApi.compact({
      channels: context.propsValue.channels,
      caption: context.propsValue.caption,
      title: context.propsValue.title,
      link: context.propsValue.link,
      media,
      visibility: context.propsValue.visibility,
      scheduled_at: timing === 'scheduled' ? scheduledAt : undefined,
      use_queue: timing === 'queue' ? true : undefined,
      timezone: timing === 'queue' ? context.propsValue.timezone : undefined,
    });
    const response = await hermosoApi.send<unknown>({
      apiKey,
      brand,
      method: HttpMethod.POST,
      path: '/posts',
      body,
      headers: {
        'Idempotency-Key': hermosoApi.idempotencyKey({
          runId: context.run.id,
          stepName: context.step.name,
          operation: 'post',
          payload: { brand: brand ?? '', body },
        }),
      },
    });
    return flattenPost(hermosoApi.isRecord(response.body) ? response.body : {});
  },
});

function flattenPost(post: Record<string, unknown>) {
  const media = Array.isArray(post['media']) ? post['media'].filter(hermosoApi.isRecord) : [];
  const results = Array.isArray(post['results']) ? post['results'].filter(hermosoApi.isRecord) : [];
  const failed = results.filter((result) => result['ok'] === false);
  return {
    post_id: hermosoApi.text(post['id']) || null,
    status: hermosoApi.text(post['status']) || null,
    scheduled_at: hermosoApi.text(post['scheduled_at']) || null,
    created_at: hermosoApi.text(post['created_at']) || null,
    channels: hermosoApi.textList(post['channels']).join(', '),
    caption: hermosoApi.text(post['caption']),
    title: hermosoApi.text(post['title_effective']) || hermosoApi.text(post['title']),
    link: hermosoApi.text(post['link']) || null,
    visibility: hermosoApi.text(post['visibility']) || null,
    media_urls: media.map((item) => hermosoApi.text(item['url'])).filter((url) => url.length > 0),
    published_urls: results
      .filter((result) => result['ok'] !== false)
      .map((result) => hermosoApi.text(result['url']))
      .filter((url) => url.length > 0),
    failed_channels: failed.map((result) => hermosoApi.text(result['channel'])).join(', '),
    error_summary: failed
      .map((result) => `${hermosoApi.text(result['channel'])}: ${hermosoApi.text(result['error']) || 'failed'}`)
      .join('; '),
    status_detail: hermosoApi.text(post['status_detail']) || null,
  };
}
