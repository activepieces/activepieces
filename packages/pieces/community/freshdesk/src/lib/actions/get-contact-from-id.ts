import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { freshdeskAuth } from '../..';

export const getContactFromID = createAction({
  auth: freshdeskAuth,
  name: 'get_contact_from_id',
  displayName: 'Get Contact from ID',
  description: 'Get contacts details from Freshdesk using ID number.',

  props: {
    contactid: Property.ShortText({
      displayName: 'Contact ID number',
      description: 'The ID number of the contact',
      required: true,
    }),
  },

  async run(context) {
    const FDapiToken = context.auth.access_token;
    const FDcontactID = context.propsValue.contactid;

    const headers = {
      Authorization: FDapiToken,
      'Content-Type': 'application/json',
    };

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    // not needed for gettickets ?${queryParams.toString()}
    const url = `${baseUrl}/api/v2/contacts/${FDcontactID}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };
    const response = await httpClient.sendRequest(httprequestdata);

    if (response.status == 200) {
      return response.body;
    } else {
      return response;
    }
  },
});
