import { createAction, Property } from '@activepieces/pieces-framework';
import { octopushAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addContact = createAction({
  auth: octopushAuth,
  name: 'addContact',
  displayName: 'Add Contact',
  description: 'Add one or more contacts to a contact list',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates or updates a contact in an Octopush contact list, keyed by phone number (international format required). Use to register or enrich a recipient before messaging; optionally assign it to a named list and a tag. By default an existing contact is updated, but enabling "Do Not Overwrite" makes it skip already-present numbers. Not idempotent: re-running can re-add or re-update the contact.',
    idempotent: false,
  },
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'The phone number in international format (e.g., +33612345678)',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    list_name: Property.ShortText({
      displayName: 'List Name',
      description:
        'Name of the contact list to add the contact to (optional, max 30 chars)',
      required: false,
    }),
    tag_name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Tag to attach to the contact (optional, max 20 chars)',
      required: false,
    }),
    do_not_overwrite: Property.Checkbox({
      displayName: 'Do Not Overwrite',
      description:
        'If enabled, will skip the contact if it already exists instead of updating it',
      required: false,
      defaultValue: false,
    }),
    auto_remove_blacklisted: Property.Checkbox({
      displayName: 'Auto Remove Blacklisted',
      description:
        'If enabled, blacklisted numbers will be automatically removed from the list',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      phone_number,
      first_name,
      last_name,
      email,
      list_name,
      tag_name,
      do_not_overwrite,
      auto_remove_blacklisted,
    } = context.propsValue;

    const contact: any = {
      phone_number,
    };

    if (first_name) contact.first_name = first_name;
    if (last_name) contact.last_name = last_name;
    if (email) contact.email = email;

    const request: any = {
      contacts: [contact],
    };

    if (list_name) request.list_name = list_name;
    if (tag_name) request.tag_name = tag_name;
    if (do_not_overwrite) request.do_not_overwrite = do_not_overwrite;
    if (auto_remove_blacklisted)
      request.auto_remove_blacklisted_numbers = auto_remove_blacklisted;

    const response = await makeRequest<any>(
      context.auth.props.api_key,
      context.auth.props.api_login,
      HttpMethod.POST,
      '/contact/create',
      request
    );

    return response;
  },
});
