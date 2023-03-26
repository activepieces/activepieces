import { Property } from "@activepieces/framework";

export const sendInBlueProps = {
  api_key: Property.SecretText({
    displayName: "Project API key",
    description: "Your project API key",
    required: true
  }),
  email: Property.ShortText({
    displayName: "Email",
    description: `Email address of the user. Mandatory if "SMS" field is not passed in "attributes" parameter. Mobile Number in SMS field should be passed with proper country code. For example: {"SMS":"+91xxxxxxxxxx"} or {"SMS":"0091xxxxxxxxxx"}`,
    required: true
  }),
  ext_id: Property.ShortText({
    displayName: "External ID",
    description: `Pass your own Id to create a contact.`,
    required: false
  }),
  attributes: Property.Object({
    displayName: "Attributes",
    description: `Pass the set of attributes and their values. The attribute's parameter should be passed in capital letter while creating a contact. These attributes must be present in your SendinBlue account. For eg:
    {"FNAME":"Elly", "LNAME":"Roger"}`,
    required: false,
    defaultValue: {
      "FIRST_NAME": "",
      "LAST_NAME": "",
      "SMS": "",
      "CIV": "",
      "DOB": "",
      "ADDRESS": "",
      "ZIP_CODE": "",
      "CITY": "",
      "AREA": ""
    }
  }),
  email_blacklisted: Property.Checkbox({
    displayName: "Email Blacklisted?",
    description: `Set this field to blacklist the contact for emails (emailBlacklisted = true)`,
    required: false,
    defaultValue: false
  }),
  sms_blacklisted: Property.Checkbox({
    displayName: "SMS Blacklisted?",
    description: `Set this field to blacklist the contact for SMS (smsBlacklisted = true)`,
    required: false,
    defaultValue: false
  }),
  list_ids: Property.Array({
    displayName: "List IDs",
    description: `Ids of the lists to add the contact to.`,
    required: false,
    defaultValue: []
  }),
  update_enabled: Property.Checkbox({
    displayName: "Update Enabled?",
    description: `Facilitate to update the existing contact in the same request (updateEnabled = true).`,
    required: false,
    defaultValue: false
  }),
  smtp_blacklist_sender: Property.Checkbox({
    displayName: "SMTP Blacklist Sender",
    description: `transactional email forbidden sender for contact. Use only for email Contact ( only available if updateEnabled = true )`,
    required: false,
    defaultValue: false
  }),
}