import { createAction } from '@activepieces/pieces-framework';
import { sendPulseAuth } from '../common/auth';
import { mailingListId, emails } from '../common/props';
import { sendPulseApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteContact = createAction({
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Permanently delete one or more subscribers from a mailing list by email.',
  auth: sendPulseAuth,
  props: {
    addressBookId: mailingListId,
    emails,
  },
  async run({ propsValue, auth }) {
    const { addressBookId, emails } = propsValue;
    if (!emails || emails.length === 0) {
      throw new Error('You must provide at least one email to delete.');
    }
    const body = { emails };
    try {
      const data = await sendPulseApiCall({
        method: HttpMethod.DELETE,
        resourceUri: `/addressbooks/${addressBookId}/emails`,
        body,
        auth,
      });
      return {
        success: true,
        message: `Deleted ${emails.length} contact(s) successfully`,
        data,
      };
    } catch (error) {
      throw new Error(`Failed to delete contact(s): ${error instanceof Error ? error.message : String(error)}`);
    }
  },
}); 