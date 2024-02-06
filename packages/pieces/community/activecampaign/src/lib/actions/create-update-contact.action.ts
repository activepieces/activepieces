import { HttpMethod, httpClient } from "@activepieces/pieces-common"
import { Property, createAction } from "@activepieces/pieces-framework"
import { activeCampaignAuth } from "../.."

export const activeCampaignCreateContact = createAction({
  name: 'create_contact',
  description: 'Create a new Contact, or update existing Contact',
  displayName: 'Create or Update Contact',
  auth: activeCampaignAuth,
  props: {
    contact_id: Property.ShortText({
      displayName: "Contact Id",
      description: "Contact Id of the Contact to update",
      required: false
    }),
    first_name: Property.ShortText({
      displayName: "First Name",
      description: "Contact first name",
      required: false
    }),
    last_name: Property.ShortText({
      displayName: "Last Name",
      description: "Contact last name",
      required: false
    }),
    email: Property.ShortText({
      displayName: "E-mail",
      description: "Contact E-mail",
      required: true
    }),
    phone: Property.ShortText({
      displayName: "Phone",
      description: "Contact phone number",
      required: false
    }),
    field_values: Property.Object({
      displayName: "Field Values",
      description: "Custom Values",
      required: false
    })
  },
  async run({ propsValue, auth }) {
    const url = `https://${auth.account_name}.api-us1.com/api/3/contacts`
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: propsValue.contact_id ? `${url}/${propsValue.contact_id}` : url,
      headers: {
        'Api-Token': auth.api_key
      },
      body: {
        contact: {
          firstName: propsValue.first_name,
          lastName: propsValue.last_name,
          email: propsValue.email,
          phone: propsValue.phone,
          fieldValues: propsValue.field_values ? [propsValue.field_values] : []
        }
      }
    })
  }
})