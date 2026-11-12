import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccContacts } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { ccData } from '../../common/types';
import { contactOutputSchema } from '../../common/output-schemas';

export const unsubscribeContactAiAction = createAction({
  auth: constantContactAuth,
  name: 'unsubscribe_contact_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Contact',
  description: 'Unsubscribes a contact from all email sent by the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets a Constant Contact contact to unsubscribed (opt-out source Account) so it receives no more email campaigns; the contact and its lists are kept. Re-subscribing needs the consent of the contact: Create or Update Contact would re-subscribe them, so do not use it on this contact without that consent. Does nothing if already unsubscribed, so repeating is safe.',
    idempotent: true,
  },
  outputSchema: contactOutputSchema,
  props: {
    contact_id_or_email: aiProps.contactIdOrEmail(),
    reason: aiProps.text({ displayName: 'Reason', description: 'Optional opt-out reason, up to 255 characters.' }),
  },
  async run({ auth, propsValue }) {
    const reason = ccInput.textWithin({ value: propsValue.reason, label: 'Reason', max: 255 });
    const contactId = await ccContacts.resolveContactId({ accessToken: auth.access_token, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
    const current = await ccContacts.getContact({ accessToken: auth.access_token, contactId });
    const permission = ccData.textAt({ value: ccData.recordAt({ value: current, key: 'email_address' }), key: 'permission_to_send' });
    if (permission === 'unsubscribed') {
      return current;
    }
    return ccContacts.updateContact({ accessToken: auth.access_token, contactId, changes: {}, unsubscribe: { reason } });
  },
});
