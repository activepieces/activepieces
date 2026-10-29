import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { applyClearFields, clearFieldsProp } from '../../common/clear-fields';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostMemberOutputSchema } from '../../output-schemas';

export const ghostUpdateMember = createAction({
  auth: ghostAuth,
  name: 'ghost_update_member',
  outputSchema: ghostMemberOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Member',
  description: 'Update the details, labels or newsletters of a member.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edits a member by ID; only the inputs you supply change, and Clear Fields blanks the name or note. Labels and Newsletter IDs replace the full list, and an empty list removes all of them; to add or remove one item use Add Member Label, Remove Member Label, Subscribe Member to Newsletters or Unsubscribe Member from Newsletters.',
    idempotent: true,
  },
  props: {
    member_id: ghostProps.id('Member ID', 'The member ID, from List Members or Get Member by Email.'),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The new email address.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new full name.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'The new private staff note.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The complete list of label names the member should have. Missing labels are created, and an empty list removes every label.',
      required: false,
    }),
    newsletter_ids: ghostProps.newsletterIds(
      'Newsletter IDs',
      'The complete list of newsletter IDs the member should be subscribed to. An empty list unsubscribes the member from every newsletter.',
      false
    ),
    clear_fields: clearFieldsProp([
      { label: 'Name', value: 'name' },
      { label: 'Note', value: 'note' },
    ]),
  },
  async run(context) {
    const { member_id, email, name, note, labels, newsletter_ids, clear_fields } = context.propsValue;
    const id = ghostCommon.id(member_id, 'Member ID');
    const body = applyClearFields({
      body: ghostResource.pick({ email, name, note }, ['email', 'name', 'note']),
      clear: clear_fields,
      allowed: ['name', 'note'],
      clearValue: '',
    });
    if (Array.isArray(labels)) {
      body['labels'] = (ghostCommon.stringList(labels) ?? []).map((label) => ({ name: label }));
    }
    if (Array.isArray(newsletter_ids)) {
      body['newsletters'] = (ghostCommon.stringList(newsletter_ids) ?? []).map((newsletterId) => ({ id: newsletterId }));
    }
    return ghostResource.edit(context.auth, 'members', id, body);
  },
});
