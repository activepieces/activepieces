import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";

export const xeroCreateContact = createAction({
  name: 'xero_create_contact',
  description: 'Create Xero Contact',
  displayName: 'Create or Update Contact',
  sampleData: {
    "Contacts": [{
      "Name": "Bruce Banner", "EmailAddress":
        "hulk@avengers.com", "Phones": [{
          "PhoneType": "MOBILE",
          "PhoneNumber": "555-1212", "PhoneAreaCode": "415"
        }],
      "PaymentTerms": {
        "Bills": {
          "Day": 15, "Type": "OFCURRENTMONTH"
        }, "Sales": { "Day": 10, "Type": "DAYSAFTERBILLMONTH" }
      }
    }]
  },
  props: {
    authentication: Property.OAuth2({
      description: "",
      displayName: 'Authentication',
      authUrl: "https://app.clickup.com/api",
      tokenUrl: "https://app.clickup.com/api/v2/oauth/token",
      required: true,
      scope: [
        'accounting.contacts'
      ]
    }),
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: "ID of the contact to update",
      required: false
    }),
    name: Property.ShortText({
      displayName: "Name",
      description: "Contact name, in full.",
      required: true
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Email address of the contact.",
      required: true
    })
  },
  async run(context) {
    const { name, email, contact_id } = context.propsValue

    const body = {
      Contacts: [{
        Name: name,
        EmailAddress: email
      }]
    }
    const url = 'https://api.xero.com/api.xro/2.0/Contacts'

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: contact_id ? `${url}/${contact_id}` : url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication.access_token
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Contact creation response", result)

    if (result.status === 200) {
      return result.body
    }

    return result
  }
});
