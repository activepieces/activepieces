import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactDropdown, contactHandleDropdown } from '../common/props';

export const removeContactHandle = createAction({
  auth: frontAuth,
  name: 'remove_contact_handle',
  displayName: 'Remove Contact Handle',
  description: 'Remove a handle from a contact.',
  props: {
    contact_id: contactDropdown,
    handle_info: contactHandleDropdown, 
    force: Property.Checkbox({
        displayName: 'Force',
        description: 'Force the deletion of the contact if this is their last handle.',
        required: false,
        defaultValue: false,
    }),
  },
  async run(context) {
    const { contact_id, handle_info, force } = context.propsValue;
    const token = context.auth;

    const { handle, source } = JSON.parse(handle_info as string);

    await makeRequest(
        token,
        HttpMethod.DELETE,
        `/contacts/${contact_id}/handles`,
        {
            handle: handle,
            source: source,
            force: force,
        }
    );

    return { success: true };
  },
});