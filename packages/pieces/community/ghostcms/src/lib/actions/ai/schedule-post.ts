import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPostOutputSchema } from '../../output-schemas';

export const ghostSchedulePost = createAction({
  auth: ghostAuth,
  name: 'ghost_schedule_post',
  outputSchema: ghostPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Schedule Post',
  description: 'Schedule a draft post to publish at a future time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Schedules a draft or already scheduled post to publish at a future Published At; Ghost rejects times in the past or only moments away. With Newsletter Slug the post is also emailed when it goes live. Use Unpublish Post to cancel.',
    idempotent: false,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
    published_at: Property.DateTime({
      displayName: 'Published At',
      description: 'When to publish. Must be in the future.',
      required: true,
    }),
    newsletter: ghostProps.newsletterSlug,
    email_segment: ghostProps.emailSegment,
    email_only: ghostProps.emailOnly,
  },
  async run(context) {
    const { post_id, published_at, newsletter, email_segment, email_only } = context.propsValue;
    const id = ghostCommon.id(post_id, 'Post ID');
    const hasNewsletter = ghostCommon.hasText(newsletter);
    if (email_only && !hasNewsletter) {
      throw new Error('Email Only requires Newsletter Slug.');
    }
    const body: Record<string, unknown> = {
      status: 'scheduled',
      published_at: ghostCommon.futureDate(published_at, 'Published At'),
    };
    if (email_only) {
      body['email_only'] = true;
    }
    return ghostContent.edit(context.auth, 'posts', id, body, {
      newsletter: hasNewsletter ? newsletter.trim() : undefined,
      email_segment: hasNewsletter ? email_segment?.trim() || 'all' : undefined,
    });
  },
});
