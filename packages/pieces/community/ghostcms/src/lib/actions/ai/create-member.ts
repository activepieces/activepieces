import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostCreateMember = createAction({
  auth: ghostAuth,
  name: 'ghost_create_member',
  outputSchema: ghostMemberOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Member',
  description: 'Add a new member to the publication.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a free member by email with optional name, note, labels (by name, created if missing) and newsletter IDs. Without Newsletter IDs Ghost subscribes the member to the newsletters that auto-subscribe new signups. Ghost rejects an email that is already a member, so use Get Member by Email first.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The member email address.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The member full name.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'A private note about the member, visible only to staff.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Label names to apply. Missing labels are created.',
      required: false,
    }),
    newsletter_ids: ghostProps.newsletterIds(
      'Newsletter IDs',
      'The newsletters to subscribe the member to, from List Newsletters.',
      false
    ),
  },
  async run(context) {
    const { email, name, note, labels, newsletter_ids } = context.propsValue;
    const body = ghostResource.pick({ email, name, note }, ['email', 'name', 'note']);
    const labelNames = ghostCommon.stringList(labels);
    if (labelNames) {
      body['labels'] = labelNames.map((label) => ({ name: label }));
    }
    const newsletters = ghostCommon.stringList(newsletter_ids);
    if (newsletters) {
      body['newsletters'] = newsletters.map((id) => ({ id }));
    }
    return ghostResource.create(context.auth, 'members', body);
  },
});
