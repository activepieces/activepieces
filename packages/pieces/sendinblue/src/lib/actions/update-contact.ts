import { httpClient, HttpMethod, HttpRequest, createAction, Property } from "@activepieces/framework";
import { sendInBlueProps } from "../common/props";

export const sendinBlueUpdateContact = createAction({
  name: 'send_in_blue_update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact',
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
  props: {
    ...sendInBlueProps,
    contact_id: Property.ShortText({
      displayName: "Contact ID",
      description: `ID of the contact`,
      required: false
    }),
    unlink_list_ids: Property.Array({
      displayName: "List IDs",
      description: `Ids of the lists to add the contact to.`,
      required: false,
      defaultValue: []
    }),
  },
  async run(context) {
    const contact = {
      ext_id: context.propsValue.ext_id,
      attributes: context.propsValue.attributes,
      emailBlacklisted: context.propsValue.email_blacklisted,
      smsBlacklisted: context.propsValue.sms_blacklisted,
      listIds: context.propsValue.list_ids,
      unlinkListIds: context.propsValue.unlink_list_ids,
      updateEnabled: context.propsValue.update_enabled,
      smtpBlacklistSender: context.propsValue.smtp_blacklist_sender
    }
    const identifier = context.propsValue.contact_id ?? context.propsValue.email

    // filter out undefined values
    const body = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => Boolean(value))
    )

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.sendinblue.com/v3/contacts/${encodeURI(identifier)}`,
      body,
      headers: {
        'api-key': context.propsValue.api_key
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Contact update response", result)

    if (result.status === 200) {
      return result.body
    }

    return result
  }
});