
import { httpClient, HttpMethod, HttpRequest, createAction } from "@activepieces/framework";
import { sendInBlueProps } from "../common/props";

export const sendinBlueCreateContact = createAction({
  name: 'send_in_blue_create_contact',
  displayName: 'Create New Contact',
  description: 'Create a new contact',
  sampleData: {
    "id":
     42,
    "email": "peggy.rain@example.com",
    "emailBlacklisted": false,
    "smsBlacklisted": false,
    "createdAt": "2017-05-02T16:40:31Z",
    "modifiedAt": "2017-05-02T16:40:31Z",
    "attributes": {
      "FIRST_NAME": "Peggy",
      "LAST_NAME": "Rain",
      "SMS": "3087433387669",
      "CIV": "1",
      "DOB": "1986-04-13",
      "ADDRESS": "987 5th avenue",
      "ZIP_CODE": "87544",
      "CITY": "New-York",
      "AREA": "NY"
    },
    "listIds": [
      40
    ]
  },
  props: sendInBlueProps,
  async run(context) {
    const contact = {
      email: context.propsValue.email,
      ext_id: context.propsValue.ext_id,
      attributes: context.propsValue.attributes,
      emailBlacklisted: context.propsValue.email_blacklisted,
      smsBlacklisted: context.propsValue.sms_blacklisted,
      list_ids: context.propsValue.list_ids,
      updateEnabled: context.propsValue.update_enabled,
      smtpBlacklistSender: context.propsValue.smtp_blacklist_sender
    }

    // filter out undefined values
    const body = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => Boolean(value))
    )

    console.debug("body", body)

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.sendinblue.com/v3/contacts`,
      body,
      headers: {
        'api-key': context.propsValue.api_key
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