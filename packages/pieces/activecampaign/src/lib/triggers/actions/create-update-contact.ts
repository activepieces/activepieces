import { createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";
import { activeCampaignProps } from "../../common";

export const activeCampaignCreateContact = createAction({
  name: 'create_contact',
  description: 'Create a new Contact, or update existing Contact',
  displayName: 'Create or Update Contact',
  props: {
    ...activeCampaignProps,
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
  async run({ propsValue }) {
    const url = `https://${propsValue.account_name}.api-us1.com/api/3/contacts`
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: propsValue.contact_id ? `${url}/${propsValue.contact_id}` : url,
      headers: {
        'Api-Token': propsValue.authentication
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
  },
  sampleData: {
    "fieldValues": [
      {
        "contact": "113",
        "field": "1",
        "value": "The Value for First Field",
        "cdate": "2020-08-01T10:54:59-05:00",
        "udate": "2020-08-01T14:13:34-05:00",
        "links": {
          "owner": "https://:account.api-us1.com/api/3/fieldValues/11797/owner",
          "field": "https://:account.api-us1.com/api/3/fieldValues/11797/field"
        },
        "id": "11797",
        "owner": "113"
      },
      {
        "contact": "113",
        "field": "6",
        "value": "2008-01-20",
        "cdate": "2020-08-01T10:54:59-05:00",
        "udate": "2020-08-01T14:13:34-05:00",
        "links": {
          "owner": "https://:account.api-us1.com/api/3/fieldValues/11798/owner",
          "field": "https://:account.api-us1.com/api/3/fieldValues/11798/field"
        },
        "id": "11798",
        "owner": "113"
      }
    ],
    "contact": {
      "email": "johndoe@example.com",
      "cdate": "2018-09-28T13:50:41-05:00",
      "udate": "2018-09-28T13:50:41-05:00",
      "orgid": "",
      "links": {
        "bounceLogs": "https://:account.api-us1.com/api/:version/contacts/113/bounceLogs",
        "contactAutomations": "https://:account.api-us1.com/api/:version/contacts/113/contactAutomations",
        "contactData": "https://:account.api-us1.com/api/:version/contacts/113/contactData",
        "contactGoals": "https://:account.api-us1.com/api/:version/contacts/113/contactGoals",
        "contactLists": "https://:account.api-us1.com/api/:version/contacts/113/contactLists",
        "contactLogs": "https://:account.api-us1.com/api/:version/contacts/113/contactLogs",
        "contactTags": "https://:account.api-us1.com/api/:version/contacts/113/contactTags",
        "contactDeals": "https://:account.api-us1.com/api/:version/contacts/113/contactDeals",
        "deals": "https://:account.api-us1.com/api/:version/contacts/113/deals",
        "fieldValues": "https://:account.api-us1.com/api/:version/contacts/113/fieldValues",
        "geoIps": "https://:account.api-us1.com/api/:version/contacts/113/geoIps",
        "notes": "https://:account.api-us1.com/api/:version/contacts/113/notes",
        "organization": "https://:account.api-us1.com/api/:version/contacts/113/organization",
        "plusAppend": "https://:account.api-us1.com/api/:version/contacts/113/plusAppend",
        "trackingLogs": "https://:account.api-us1.com/api/:version/contacts/113/trackingLogs",
        "scoreValues": "https://:account.api-us1.com/api/:version/contacts/113/scoreValues"
      },
      "id": "113",
      "organization": ""
    }
  }
})