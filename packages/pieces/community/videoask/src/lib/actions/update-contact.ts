import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { organizationIdDropdown } from '../common/props';
import { videoaskAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const updateContact = createAction({
  auth: videoaskAuth,
  name: 'updateContact',
  displayName: 'Update contact',
  description: 'Update an existing respondent (contact) in VideoAsk',
  props: {
    organizationId: organizationIdDropdown,
    respondentId: Property.ShortText({
      displayName: 'Respondent ID',
      description: 'The ID of the respondent to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the contact',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact',
      required: false,
    }),
  },
  async run(context) {
    const { organizationId, respondentId, name, email, phone_number } = context.propsValue;
    const access_token = context.auth.access_token as string;

    const body: Record<string, unknown> = {};
    if (name !== undefined && name !== null && name !== '') body['name'] = name;
    if (email !== undefined && email !== null && email !== '') body['email'] = email;
    if (phone_number !== undefined && phone_number !== null && phone_number !== '') body['phone_number'] = phone_number;

    const path = `/respondents/${respondentId}`;

    const response = await makeRequest(organizationId as string, access_token, HttpMethod.PATCH, path, body);

    return response;
  },
});
