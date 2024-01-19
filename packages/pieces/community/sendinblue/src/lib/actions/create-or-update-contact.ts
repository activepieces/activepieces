import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { sendinblueAuth } from '../..';

export const createOrUpdateContact = createAction({
  auth: sendinblueAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create or update an existing contact',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: `Email address of the user. Mandatory if "SMS" field is not passed in "attributes" parameter. Mobile Number in SMS field should be passed with proper country code. For example: {"SMS":"+91xxxxxxxxxx"} or {"SMS":"0091xxxxxxxxxx"}`,
      required: true,
    }),
    ext_id: Property.ShortText({
      displayName: 'External ID',
      description: `Pass your own Id to create a contact.`,
      required: false,
    }),
    attributes: Property.Object({
      displayName: 'Attributes',
      description: `Pass the set of attributes and their values. The attribute's parameter should be passed in capital letter while creating a contact. These attributes must be present in your SendinBlue account. For eg:
        {"FNAME":"Elly", "LNAME":"Roger"}`,
      required: false,
      defaultValue: {
        FIRST_NAME: '',
        LAST_NAME: '',
        SMS: '',
        CIV: '',
        DOB: '',
        ADDRESS: '',
        ZIP_CODE: '',
        CITY: '',
        AREA: '',
      },
    }),
    email_blacklisted: Property.Checkbox({
      displayName: 'Email Blacklisted?',
      description: `Set this field to blacklist the contact for emails (emailBlacklisted = true)`,
      required: false,
      defaultValue: false,
    }),
    sms_blacklisted: Property.Checkbox({
      displayName: 'SMS Blacklisted?',
      description: `Set this field to blacklist the contact for SMS (smsBlacklisted = true)`,
      required: false,
      defaultValue: false,
    }),
    list_ids: Property.Array({
      displayName: 'List IDs',
      description: `Ids of the lists to add the contact to.`,
      required: false,
      defaultValue: [],
    }),
    smtp_blacklist_sender: Property.Checkbox({
      displayName: 'SMTP Blacklist Sender',
      description: `transactional email forbidden sender for contact. Use only for email Contact ( only available if updateEnabled = true )`,
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    let listIds: number[] = [];
    if (context.propsValue.list_ids) {
      listIds = context.propsValue.list_ids.map((listId) => {
        return parseInt(listId as unknown as string);
      });
    }
    const contact = {
      email: context.propsValue.email,
      ext_id: context.propsValue.ext_id,
      attributes: context.propsValue.attributes,
      emailBlacklisted: context.propsValue.email_blacklisted,
      smsBlacklisted: context.propsValue.sms_blacklisted,
      listIds: listIds,
      smtpBlacklistSender: context.propsValue.smtp_blacklist_sender,
      updateEnabled: true,
    };
    const identifier = context.propsValue.email;

    // filter out undefined values
    const body = Object.fromEntries(
      Object.entries(contact).filter(([_, value]) => Boolean(value))
    );

    console.log('Contact update request ' + identifier);
    const updateResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.sendinblue.com/v3/contacts`,
      body,
      headers: {
        'api-key': context.auth,
      },
    });
    console.debug('Contact update response', updateResponse);

    const contactREsponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.sendinblue.com/v3/contacts/${encodeURI(identifier)}`,
      headers: {
        'api-key': context.auth,
      },
    });
    return contactREsponse.body;
  },
});
