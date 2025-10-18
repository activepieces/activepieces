import { createAction, Property } from '@activepieces/pieces-framework';
import { makeZendeskSellRequest, Contact } from '../common/common';
import { zendeskSellAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateContactAction = createAction({
  auth: zendeskSellAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields of an existing contact',
  props: {
    contactId: Property.Number({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      description: 'Mobile number',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes',
      required: false,
    }),
    ownerId: Property.Number({
      displayName: 'Owner ID',
      description: 'ID of the user who owns this contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field values as JSON object',
      required: false,
    }),
  },
  async run(context) {
    const contactData: any = {
      data: {},
    };

    if (context.propsValue.firstName) contactData.data.first_name = context.propsValue.firstName;
    if (context.propsValue.lastName) contactData.data.last_name = context.propsValue.lastName;
    if (context.propsValue.email) contactData.data.email = context.propsValue.email;
    if (context.propsValue.phone) contactData.data.phone = context.propsValue.phone;
    if (context.propsValue.mobile) contactData.data.mobile = context.propsValue.mobile;
    if (context.propsValue.title) contactData.data.title = context.propsValue.title;
    if (context.propsValue.description) contactData.data.description = context.propsValue.description;
    if (context.propsValue.ownerId) contactData.data.owner_id = context.propsValue.ownerId;
    if (context.propsValue.tags) contactData.data.tags = context.propsValue.tags;
    if (context.propsValue.customFields) contactData.data.custom_fields = context.propsValue.customFields;

    const response = await makeZendeskSellRequest<{ data: Contact }>(
      context.auth,
      HttpMethod.PUT,
      `/contacts/${context.propsValue.contactId}`,
      contactData
    );

    return {
      success: true,
      contact: response.data,
    };
  },
});
