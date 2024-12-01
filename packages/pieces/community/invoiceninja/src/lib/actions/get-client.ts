import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { invoiceninjaAuth } from '../..';

export const getClient = createAction({
  auth: invoiceninjaAuth,
  name: 'getclient_task',
  displayName: 'Get Client Details from e-mail',
  description: 'Gets the client details if they exist by e-mail.',

  props: {
    email: Property.LongText({
      displayName: 'Client e-mail address', 
      description: 'A valid e-mail address to get client details for',
      required: true,
    }),
  },

  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      email: z.string().email(),
    });

    const INapiToken = context.auth.access_token;

    const headers = {
      'X-Api-Token': INapiToken,
    };
    const queryParams = new URLSearchParams();
    queryParams.append('email', context.propsValue.email || '');

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/clients/?${queryParams.toString()}`;
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    try {
      const response = await httpClient.sendRequest(httprequestdata);
      // Process the successful response here (status 2xx).
      //
      if (response.body.meta.pagination.total > 0) {
        // Each client that is found will have one or more contacts
        const NumberOfContactsThisClient =
          response.body.data[0].contacts.length;
        for (let i = 0; i < NumberOfContactsThisClient; i++) {
          // theres a lot of extra data I don't really want in the actual response of contacts so I want to tr and just pick out
          // firstname, lastname, email, etc as I don't think we need the rest, just to keep it simpler
          delete response.body.data[0].contacts[i].id;
          delete response.body.data[0].contacts[i].created_at;
          delete response.body.data[0].contacts[i].updated_at;
          delete response.body.data[0].contacts[i].archived_at;
          delete response.body.data[0].contacts[i].is_primary;
          delete response.body.data[0].contacts[i].is_locked;
          delete response.body.data[0].contacts[i].contact_key;
          delete response.body.data[0].contacts[i].send_email;
          delete response.body.data[0].contacts[i].last_login;
          delete response.body.data[0].contacts[i].password;
          delete response.body.data[0].contacts[i].link;
        }
        const json = [
          {
            client_no_contacts: NumberOfContactsThisClient,
            client_id: response.body.data[0].id,
            client_name: response.body.data[0].name,
            client_web: response.body.data[0].website,
            client_private_notes: response.body.data[0].private_notes,
            client_balance: response.body.data[0].balance,
            client_paid_to_date: response.body.data[0].paid_to_date,
            client_payment_balance: response.body.data[0].payment_balance,
            client_credit_balance: response.body.data[0].credit_balance,
            client_public_notes: response.body.data[0].public_notes,
            client_address1: response.body.data[0].address1,
            client_address2: response.body.data[0].address2,
            client_phone: response.body.data[0].phone,
            client_city: response.body.data[0].city,
            client_state: response.body.data[0].state,
            client_postcode: response.body.data[0].postal_code,
            client_vat: response.body.data[0].vat_number,
            client_display_name: response.body.data[0].display_name,
            client_contacts: response.body.data[0].contacts,
            //meta: response.body.meta,
          },
        ];
        return json;
        return true;
      } else {
        return false;
      } // this is still returned so if it is false we'll return notfound or similar
    } catch (error) {
      // Handle the error when the request fails (status other than 2xx).
      return 'There was a problem getting information from your Invoice Ninja';
    }
  },
});
