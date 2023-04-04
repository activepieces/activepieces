import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest } from "@activepieces/framework";
import { props } from "../common/props";

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
    authentication: props.authentication,
    tenant_id: props.tenant_id,
    contact_id: props.contact_id(false),
    name: props.contact_name(true),
    email: props.contact_email(false)
  },
  async run(context) {
    const { name, email, contact_id, tenant_id } = context.propsValue
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
      },
      headers: {
        'Xero-Tenant-Id': tenant_id
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
