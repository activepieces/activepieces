import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { TinkoContact, TinkoItemResponse, tinkoClient } from '../common/client';
import { tinkoContact } from '../common/contact';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';

export const createContactAction = createAction({
  auth: tinkoAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Tinko.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new contact in Tinko from a phone number, with optional name, tags and custom field values. Use Find Contact first when the contact may already exist, since Tinko rejects duplicate phone numbers. Not safe to retry blindly.',
    idempotent: false,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number with country code and area code, for example 5511999999999.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name of the contact, for example Jane Smith.',
      required: false,
    }),
    tags: tinkoProps.tagsMultiSelect({
      description: 'Tags to add to the new contact.',
    }),
    blocked: Property.Checkbox({
      displayName: 'Blocked',
      description: 'Whether the contact is blocked and cannot start conversations.',
      required: false,
      defaultValue: false,
    }),
    customFields: tinkoProps.customFields({
      description: 'Values for the custom contact fields configured in Tinko. Leave a field empty to skip it.',
    }),
  },
  async run(context) {
    const { phone, name, tags, blocked, customFields } = context.propsValue;
    const token = context.auth.secret_text;
    const filledFields = await tinkoContact.resolveCustomFields({ token, values: customFields });
    const response = await tinkoClient.request<TinkoItemResponse<TinkoContact>>({
      token,
      method: HttpMethod.POST,
      path: '/contacts',
      body: {
        phone: phone.trim(),
        ...(name ? { name } : {}),
        ...(blocked ? { blocked: true } : {}),
        ...(tags && tags.length > 0 ? { tags } : {}),
        ...(Object.keys(filledFields).length > 0 ? { customfields: filledFields } : {}),
      },
    });
    if (!response.data) {
      throw new Error('Tinko did not return the created contact');
    }
    return tinkoOutput.contact(response.data);
  },
});
