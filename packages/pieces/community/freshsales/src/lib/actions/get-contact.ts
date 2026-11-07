import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { getContactOutputSchema } from '../output-schemas';

export const getContact = createAction({
  auth: freshsalesAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Get a contact by its ID',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Freshsales contact by numeric ID, including its linked accounts. Fails with a not-found error if the ID does not exist. Use Find Contact by Email when you only know the email.',
    idempotent: true,
  },
  outputSchema: getContactOutputSchema,
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact to fetch',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.contact_id, field: 'Contact ID' });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/contacts/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.contacts },
    });
    return freshsalesRecords.shapeContact(freshsalesClient.unwrap({ body: response, key: 'contact' }));
  },
});
