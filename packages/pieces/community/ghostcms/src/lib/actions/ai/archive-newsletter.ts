import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostNewsletterOutputSchema } from '../../output-schemas';

export const ghostArchiveNewsletter = createAction({
  auth: ghostAuth,
  name: 'ghost_archive_newsletter',
  outputSchema: ghostNewsletterOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Newsletter',
  description: 'Archive a newsletter so it can no longer be sent or subscribed to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archives a newsletter: members can no longer subscribe and posts can no longer be emailed to it. Staff can reactivate it in Ghost Admin. Archiving an archived newsletter is a no-op.',
    idempotent: true,
  },
  props: {
    newsletter_id: ghostProps.id('Newsletter ID', 'The newsletter ID, from List Newsletters.'),
  },
  async run(context) {
    const id = ghostCommon.id(context.propsValue.newsletter_id, 'Newsletter ID');
    return ghostResource.edit(context.auth, 'newsletters', id, { status: 'archived' });
  },
});
