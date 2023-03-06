import { Property, OAuth2PropertyValue } from "@activepieces/framework";
import { GmailRequests } from "./data";
import { GmailLabel } from "./models";

export const GmailProps = {
  authentication: Property.OAuth2({
    description: "",
    displayName: 'Authentication',
    authUrl: "https://accounts.google.com/o/oauth2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    required: true,
    scope: ["https://www.googleapis.com/auth/gmail.readonly"]
  }),
  from: Property.ShortText({
    displayName: 'Email sender',
    description: "The address sending the new mail",
    required: false,
    defaultValue: ""
  }),
  to: Property.ShortText({
    displayName: 'Email receipient',
    description: "The address receiving the new mail",
    required: false,
    defaultValue: ""
  }),
  subject: Property.ShortText({
    displayName: 'Email subject',
    description: "The email subject",
    required: false,
    defaultValue: ""
  }),
  category: Property.StaticDropdown({
    displayName: "Category",
    description: "category of the mail",
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Primary', value: 'primary' },
        { label: 'Social', value: 'social' },
        { label: 'Promotions', value: 'promotions' },
        { label: 'Updates', value: 'updates' },
        { label: 'Forums', value: 'forums' },
        { label: 'Reservations', value: 'reservations' },
        { label: 'Purchases', value: 'purchases' }
      ]
    }
  }),
  label: Property.Dropdown<GmailLabel>({
    displayName: "Label",
    description: "The label tagged to the mail",
    required: false,
    defaultValue: "",
    refreshers: ["authentication"],
    options: async ({ authentication }) => {
      if (!authentication) {
        return {
          disabled: true,
          options: [],
          placeholder: "please authenticate first"
        }
      }

      const response = await GmailRequests.getLabels(authentication as OAuth2PropertyValue)
      
      return {
        disabled: false,
        options: response.body.labels.map((label) => (
          {
            "label": label.name,
            "value": label
          }
        ))
      }
    }
  }),
  unread: (required = false) => Property.Checkbox({
    displayName: 'Is unread?',
    description: "Check if the email is unread or not",
    required,
    defaultValue: false
  })
}