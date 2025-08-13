import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { props } from '../common/props';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';

export const CreateContact = createAction({
  auth: xeroAuth,
  name: 'xero_create_contact',
  description: 'Create Xero Contact',
  displayName: 'Create or Update Contact',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_id(false),
    name: props.contact_name(true),
    email: props.contact_email(false),
  },
  async run(context) {
    const { name, email, contact_id, tenant_id } = context.propsValue;
    const body = {
      Contacts: [
        {
          Name: name,
          EmailAddress: email,
        },
      ],
    };
  
    const result = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/Contacts',
      body,
      {
        'Xero-Tenant-Id': tenant_id,
      }
    );
    

    return result;
  },
});
