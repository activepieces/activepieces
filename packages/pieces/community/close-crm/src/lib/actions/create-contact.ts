import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const createContact = createAction({
  auth: closeCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Add a new contact to a lead in Close CRM.',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead to which this contact will be added.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the new contact.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the contact.',
      required: false,
    }),
    emails: Property.Json({
      displayName: 'Emails',
      description: 'Array of email objects, e.g., `[{"email": "john.doe@example.com", "type": "office"}]`',
      required: false,
      defaultValue: [],
    }),
    phones: Property.Json({
      displayName: 'Phones',
      description: 'Array of phone objects, e.g., `[{"phone": "+15551234567", "type": "mobile"}]`',
      required: false,
      defaultValue: [],
    }),
    urls: Property.Json({
      displayName: 'URLs',
      description: 'Array of URL objects, e.g., `[{"url": "http://example.com", "type": "url"}]`',
      required: false,
      defaultValue: [],
    }),
  },
  async run(context) {
    const { lead_id, name, title, emails, phones, urls } = context.propsValue;
    const apiKey = context.auth;

    const payload: any = {
      lead_id: lead_id,
      name: name,
    };

    if (title) payload.title = title;
    if (emails && Array.isArray(emails) && emails.length > 0) payload.emails = emails;
    if (phones && Array.isArray(phones) && phones.length > 0) payload.phones = phones;
    if (urls && Array.isArray(urls) && urls.length > 0) payload.urls = urls;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/contact/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
