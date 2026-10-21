import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const getContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_contact',
  classification: 'READ',
  displayName: 'Find Contact',
  description: 'Finds one contact in an audience by email or by contact ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single Tarvent contact in an audience by email address or by contact ID (give exactly one). Returns found=false with contact=null when there is no match, instead of failing. If the audience uses a custom identifier, an email lookup returns the first contact with that email, so use the ID when precision matters. To list many contacts use List Contacts. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.findContact,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to search.'),
    email: Property.ShortText({ displayName: 'Contact email', description: 'Find the contact by email. Leave empty when using Contact ID.', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'Find the contact by ID. Leave empty when using email.', required: false }),
  },
  async run(context) {
    const audienceId = tarventCommon.requireText({ value: context.propsValue.audienceId, label: 'Audience' });
    const email = tarventCommon.trimmed(context.propsValue.email);
    const contactId = tarventCommon.trimmed(context.propsValue.contactId);
    if ((email === undefined) === (contactId === undefined)) {
      throw new Error('Enter either Contact email or Contact ID (exactly one).');
    }
    const contact = await tarventClient.getContact({ auth: context.auth.props, audienceId, email, contactId });
    return { found: contact !== null, contact };
  },
});
