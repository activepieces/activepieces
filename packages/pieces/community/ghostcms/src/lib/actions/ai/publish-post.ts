import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostContent } from '../../common/content';
import { ghostPublishPostOutputSchema } from '../../output-schemas';

export const ghostPublishPost = createAction({
  auth: ghostAuth,
  name: 'ghost_publish_post',
  outputSchema: ghostPublishPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Publish Post',
  description: 'Publish a draft post now, optionally emailing it to a newsletter.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes a post immediately. With Newsletter Slug it also emails the post to that newsletter (all members, or Email Segment), and Email Only sends the email without putting it on the site. An email can only be sent once, so do not retry after success.',
    idempotent: false,
  },
  props: {
    post_id: ghostProps.id('Post ID', 'The post ID, from List Posts.'),
    newsletter: ghostProps.newsletterSlug,
    email_segment: ghostProps.emailSegment,
    email_only: ghostProps.emailOnly,
  },
  async run(context) {
    const { post_id, newsletter, email_segment, email_only } = context.propsValue;
    const id = ghostCommon.id(post_id, 'Post ID');
    const hasNewsletter = ghostCommon.hasText(newsletter);
    if (email_only && !hasNewsletter) {
      throw new Error('Email Only requires Newsletter Slug.');
    }
    const body: Record<string, unknown> = { status: 'published' };
    if (email_only) {
      body['email_only'] = true;
    }
    return ghostContent.edit(context.auth, 'posts', id, body, {
      newsletter: hasNewsletter ? newsletter.trim() : undefined,
      email_segment: hasNewsletter ? email_segment?.trim() || 'all' : undefined,
    });
  },
});
