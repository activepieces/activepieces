import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const createLead = createAction({
  auth: closeCrmAuth,
  name: 'create_lead',
  displayName: 'Create Lead',
  description: 'Add a new lead to Close CRM.',
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'The name of the new lead.',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Website URL for the lead.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description for the lead.',
      required: false,
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'Optional ID of the status to assign. If omitted, the default status will be used.',
      required: false,
    }),
    contacts: Property.Json({
        displayName: "Contacts",
        description: "Optional array of contact objects. E.g., ```[{\"name\": \"Jane Doe\", \"title\": \"CEO\", \"emails\": [{\"email\": \"jane@example.com\", \"type\": \"office\"}]}]```. See Close CRM API docs for full structure.",
        required: false,
        defaultValue: []
    })
    // We could add custom fields later if needed, similar to contacts (JSON object)
  },
  async run(context) {
    const { name, url, description, status_id, contacts } = context.propsValue;
    const apiKey = context.auth;

    const payload: any = {
      name: name,
    };

    if (url) payload.url = url;
    if (description) payload.description = description;
    if (status_id) payload.status_id = status_id;
    if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        payload.contacts = contacts;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/lead/`,
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
