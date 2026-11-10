import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloRequests } from '../../common/requests';

export const aiAddContactsToSequenceAction = createAction({
  auth: apolloAuth,
  name: 'ai_add_contacts_to_sequence',
  classification: 'WRITE',
  displayName: 'Add Contacts to Sequence',
  description: 'Add contacts to a sequence.',
  audience: 'ai',
  aiMetadata: {
    description: 'Enrols up to 100 saved contacts in an Apollo sequence, sending from one connected mailbox. status is required: active starts the sequence and can email real people right away; paused enrols without sending. Apollo skips contacts that are already in the sequence or fail its safety checks; each skip has its reason and already_in_sequence (true when the contact is already in this sequence, checked for up to 10 contacts). A repeat call therefore succeeds, and the step fails when nothing was added for any other reason. Uses no credits; needs a master API key.',
    idempotent: true,
  },
  props: {
    sequence_id: aiProps.id({ displayName: 'Sequence ID', description: 'Sequence ID from Search Sequences (field id).' }),
    contact_ids: aiProps.textList({ displayName: 'Contact IDs', description: 'Contact IDs from Search Contacts (field id), up to 100.', required: true }),
    email_account_id: aiProps.id({ displayName: 'Email Account ID', description: 'Mailbox ID from List Email Accounts (field id) to send from.' }),
    status: aiProps.choice({
      displayName: 'Initial Status',
      description: 'active starts sending emails; paused enrols without sending.',
      required: true,
      options: [
        { label: 'Paused', value: 'paused' },
        { label: 'Active', value: 'active' },
      ],
    }),
    user_id: aiProps.optionalId({ displayName: 'Acting User ID', description: 'User shown as having added the contacts, from List Users (field id).' }),
  },
  outputSchema: apolloOutputSchemas.sequenceAdd,
  async run({ propsValue, auth }) {
    const status = apolloInputs.requireText({ value: propsValue.status, label: 'Initial Status' });
    if (status !== 'active' && status !== 'paused') {
      throw new Error('Initial Status must be active or paused.');
    }
    const result = await apolloRequests.addContactsToSequence({
      apiKey: apiKeyOf(auth),
      sequenceId: apolloInputs.requireText({ value: propsValue.sequence_id, label: 'Sequence ID' }),
      contactIds: apolloInputs.requireStringList({ value: propsValue.contact_ids, label: 'Contact IDs', max: 100 }),
      emailAccountId: apolloInputs.requireText({ value: propsValue.email_account_id, label: 'Email Account ID' }),
      status,
      userId: apolloInputs.optionalText(propsValue.user_id),
    });
    return apolloRequests.requireSequenceProgress(result);
  },
});
