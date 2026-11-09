import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { apolloInputs } from '../common/ai-props';
import { apolloOutputSchemas } from '../common/output-schemas';
import { apolloProps } from '../common/props';
import { apolloRequests } from '../common/requests';

export const addContactToSequenceAction = createAction({
  auth: apolloAuth,
  name: 'add_contact_to_sequence',
  classification: 'WRITE',
  displayName: 'Add Contact to Sequence',
  description: 'Add contacts to an Apollo sequence, sending from a connected mailbox. Contacts Apollo skips are listed in the output.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds up to 100 contacts to an Apollo sequence picked from a dropdown, sending from a chosen mailbox, as active (starts emailing) or paused. Apollo skips contacts that are already in the sequence or fail its safety checks and the output lists each skip reason and whether the contact is already in this sequence (checked for up to 10 contacts); the step fails when no contact was added for any reason other than already being in the sequence. Uses no credits.',
    idempotent: true,
  },
  props: {
    sequence_id: apolloProps.sequence(),
    email_account_id: apolloProps.emailAccount(),
    contact_ids: apolloProps.contacts(),
    status: apolloProps.sequenceStatus(),
  },
  outputSchema: apolloOutputSchemas.sequenceAdd,
  async run({ propsValue, auth }) {
    const result = await apolloRequests.addContactsToSequence({
      apiKey: apiKeyOf(auth),
      sequenceId: apolloInputs.requireText({ value: propsValue.sequence_id, label: 'Sequence' }),
      contactIds: apolloInputs.requireStringList({ value: propsValue.contact_ids, label: 'Contacts', max: 100 }),
      emailAccountId: apolloInputs.requireText({ value: propsValue.email_account_id, label: 'Send From Mailbox' }),
      status: apolloInputs.requireText({ value: propsValue.status, label: 'Initial Status' }),
      userId: undefined,
    });
    return apolloRequests.requireSequenceProgress(result);
  },
});
