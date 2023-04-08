import { Property, createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, getAccessTokenOrThrow, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { intercomCommon } from "../common";

enum ContactRole {
  USER = "user",
  LEAD = "lead"
}
export const createContact = createAction({
  description: 'Create a contact (ie. user or lead)',
  displayName: "Create Contact",
  name: "create_contact",
  sampleData: {
    "type": "contact",
    "id": "6409ae25be4bf93b73d32f17",
    "workspace_id": "yo3vjfq2",
    "external_id": "xzww123123gg33",
    "role": "user",
    "email": "zxcvzxcvgg313",
    "phone": null,
    "name": null,
    "avatar": null,
    "owner_id": null,
    "social_profiles": {
      "type": "list",
      "data": []
    },
    "has_hard_bounced": false,
    "marked_email_as_spam": false,
    "unsubscribed_from_emails": false,
    "created_at": 1678356005,
    "updated_at": 1678356005,
    "signed_up_at": 1678356004,
    "last_seen_at": 1678356004,
    "last_replied_at": 1678356004,
    "last_contacted_at": 1678356004,
    "last_email_opened_at": 1678356004,
    "last_email_clicked_at": 1678356004,
    "language_override": null,
    "browser": null,
    "browser_version": null,
    "browser_language": null,
    "os": null,
    "location": {
      "type": "location",
      "country": null,
      "region": null,
      "city": null,
      "country_code": null,
      "continent_code": null
    },
    "android_app_name": null,
    "android_app_version": null,
    "android_device": null,
    "android_os_version": null,
    "android_sdk_version": null,
    "android_last_seen_at": null,
    "ios_app_name": null,
    "ios_app_version": null,
    "ios_device": null,
    "ios_os_version": null,
    "ios_sdk_version": null,
    "ios_last_seen_at": null,
    "custom_attributes": {},
    "tags": {
      "type": "list",
      "data": [],
      "url": "/contacts/6409ae25be4bf93b73d32f17/tags",
      "total_count": 0,
      "has_more": false
    },
    "notes": {
      "type": "list",
      "data": [],
      "url": "/contacts/6409ae25be4bf93b73d32f17/notes",
      "total_count": 0,
      "has_more": false
    },
    "companies": {
      "type": "list",
      "data": [],
      "url": "/contacts/6409ae25be4bf93b73d32f17/companies",
      "total_count": 0,
      "has_more": false
    },
    "opted_out_subscription_types": {
      "type": "list",
      "data": [],
      "url": "/contacts/6409ae25be4bf93b73d32f17/subscriptions",
      "total_count": 0,
      "has_more": false
    },
    "opted_in_subscription_types": {
      "type": "list",
      "data": [],
      "url": "/contacts/6409ae25be4bf93b73d32f17/subscriptions",
      "total_count": 0,
      "has_more": false
    },
    "utm_campaign": null,
    "utm_content": null,
    "utm_medium": null,
    "utm_source": null,
    "utm_term": null,
    "referrer": null,
    "sms_consent": false,
    "unsubscribed_from_sms": false
  },
  props: {
    connection: intercomCommon.connection,
    role: Property.StaticDropdown({
      displayName: "Role",
      required: true,
      options: {
        options: [{ label: "User", value: ContactRole.USER }, { label: "Lead", value: ContactRole.LEAD }]
      },
      defaultValue: ContactRole.USER
    }),
    email: Property.ShortText({
      displayName: "Email",
      required: true
    }),
    external_id: Property.ShortText({
      displayName: "External Id",
      required: false
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: "Avatar Url",
      required: false,
      description: "An image URL containing the avatar of a contact"
    }),
    custom_attributes: Property.Object({
      displayName: "Custom Attributes",
      required: false
    }),

  },
  run: async (context) => {
    const authentication = getAccessTokenOrThrow(context.propsValue.connection)
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.intercom.io/contacts`,
      headers: intercomCommon.intercomHeaders,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (authentication as string)
      },
      body:
      {
        role: context.propsValue.role,
        external_id: context.propsValue.external_id,
        email: context.propsValue.email,
        name: context.propsValue.name,
        phone: context.propsValue.phone,
        avatar: context.propsValue.avatar,
        custom_attributes: context.propsValue.custom_attributes,
        signed_up_at: new Date()
      }
    });
    return response.body;
  }
})