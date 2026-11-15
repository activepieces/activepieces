import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { emailitAuth } from '../auth';
import { emailitClient } from '../common/client';
import { emailitSchemas } from '../common/output-schemas';
import { emailitValues } from '../common/values';

export const findContactAction = createAction({
  auth: emailitAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Look up a contact by email address or contact ID.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Looks up one Emailit contact by email address or contact ID (con_…) and returns {found, contact} with names, custom fields, unsubscribed flag and audience memberships. found=false when no contact matches. Read-only; needs a Full Access key.',
    idempotent: true,
  },
  outputSchema: emailitSchemas.contactLookup,
  props: {
    contact: Property.ShortText({ displayName: 'Email or Contact ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const key = emailitValues.requiredText({ value: propsValue.contact, label: 'Email or Contact ID' });
    try {
      const contact = await emailitClient.request({ auth, method: HttpMethod.GET, path: `/contacts/${emailitClient.seg({ value: key, label: 'Email or Contact ID' })}` });
      return { found: true, contact };
    } catch (error) {
      if (emailitClient.statusOf(error) === 404) {
        return { found: false, contact: null };
      }
      throw error;
    }
  },
});
