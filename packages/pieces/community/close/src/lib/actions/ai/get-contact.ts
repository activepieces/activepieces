import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const getContact = createAction({
  auth: closeAuth,
  name: 'get_contact',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Get one contact by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Close contact by contact id (cont_...): name, title, lead id, all emails, phones and URLs, primary email and phone, and custom fields. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.contact,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'cont_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const contactId = closeClient.closeId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' });
    const body = await closeClient.request({ auth, method: HttpMethod.GET, path: `/contact/${closeClient.pathId(contactId)}/` });
    return closeMappers.contact(body);
  },
});

export { getContact };
