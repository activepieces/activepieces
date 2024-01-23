import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { freshsalesAuth } from '../../';

export const freshSalesCreateContact = createAction({
  auth: freshsalesAuth,
  name: 'freshsales_create_contact',
  displayName: 'Create Contact',
  description: 'Add new contact in Freshsales CRM',
  props: {
    first_name: Property.ShortText({
      displayName: 'First name',
      description: 'First name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last name',
      description: 'Last name of the contact',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job title',
      description: 'Designation of the contact in the account they belong to',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address of the contact',
      required: true,
    }),
    work_number: Property.ShortText({
      displayName: 'Work number',
      description: 'Work phone number of the contact',
      required: false,
    }),
    mobile_number: Property.ShortText({
      displayName: 'Mobile number',
      description: 'Mobile phone number of the contact',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Address of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City that the contact belongs to',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State that the contact belongs to',
      required: false,
    }),
    zipcode: Property.ShortText({
      displayName: 'Zip code',
      description: 'Zipcode of the region that the contact belongs to',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country that the contact belongs to',
      required: false,
    }),
    territory_id: Property.ShortText({
      displayName: 'Territory id',
      description: 'ID of the territory that the contact belongs to',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner id',
      description: 'ID of the user to whom the contact has been assigned',
      required: false,
    }),
    subscription_status: Property.ShortText({
      displayName: 'Subscription status',
      description: 'Status of subscription that the contact is in.',
      required: false,
    }),
    medium: Property.ShortText({
      displayName: 'Medium',
      description: 'The medium that led your contact to your website/web app',
      required: false,
    }),
    campaign_id: Property.ShortText({
      displayName: 'Campaign id',
      description: 'The campaign that led your contact to your web app.',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description:
        'The keywords that the contact used to reach your website/web app',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone that the contact belongs to',
      required: false,
    }),
    facebook: Property.ShortText({
      displayName: 'Facebook',
      description: 'Facebook username of the contact',
      required: false,
    }),
    twitter: Property.ShortText({
      displayName: 'Twitter',
      description: 'Twitter username of the contact',
      required: false,
    }),
    linkedin: Property.ShortText({
      displayName: 'Linkedin',
      description: 'LinkedIn account of the contact',
      required: false,
    }),
    contact_status_id: Property.ShortText({
      displayName: 'Contact status id',
      description: 'ID of the contact status that the contact belongs to',
      required: false,
    }),
    sales_account_id: Property.ShortText({
      displayName: 'Sales account id',
      description: 'ID of the primary account that the contact belongs to',
      required: false,
    }),
  },
  async run(context) {
    const contact = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${context.auth.username}.myfreshworks.com/crm/sales/api/contacts`,
      body: {
        contact,
      },
      headers: {
        Authorization: `Token token=${context.auth.password}`,
      },
    };

    const result = await httpClient.sendRequest(request);
    console.debug('Create contact response', result);

    if (result.status == 200) {
      return result.body;
    } else {
      return result;
    }
  },
});
