import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails, phones } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteContact = createAction({
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete one or more subscribers from a mailing list.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
    phones,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails, phones } = propsValue;
    if ((!emails || emails.length === 0) && (!phones || phones.length === 0)) {
      throw new Error('You must provide at least one email or phone to delete.');
    }
    const batch = [];
    if (emails && emails.length > 0) {
      batch.push(...emails);
    }
    if (phones && phones.length > 0) {
      batch.push(...phones);
    }
    if (batch.length === 0) {
      throw new Error('No valid emails or phones provided for deletion.');
    }
    const body = { emails: batch };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.DELETE,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Deleted ${batch.length} contact(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to delete contact(s): ${error.message}`);
    }
  },
}); 