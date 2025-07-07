import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSubmission = createAction({
  auth: formStackAuth,
  name: 'createSubmission',
  displayName: 'Create Submission',
  description:
    'Programmatically submit data to a Formstack form. Useful for integrating external data sources into forms.',
  props: {
    form_id: formIdDropdown,
    user_agent: Property.ShortText({
      displayName: 'User Agent Header',
      defaultValue: 'User Agent Header',
      required: false,
    }),
    remote_addr: Property.ShortText({
      displayName: 'Client IP',
      description: 'IP address that should be recorded for the submission',
      required: false,
    }),
    read: Property.Checkbox({
      displayName: 'Read',
      defaultValue: false,
      required: false,
    }),
    payment_status: Property.ShortText({
      displayName: 'Payment Status',
      required: false,
    }),
    field_x: Property.ShortText({
      displayName: 'Field X',
      description:
        'Value that should be stored for a specific field on the form',
      required: true,
    }),
    encryption_password: Property.ShortText({
      displayName: 'Encryption Password',
      description:
        'The password used to decrypt your submissions.Without this value, you will only receive the submission ID and the success message when submitting encrypted forms.',
      required: false,
    }),
  },
  async run(context) {
    // Action logic here
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    const {
      form_id,
      user_agent,
      remote_addr,
      read,
      payment_status,
      field_x,
      encryption_password,
    } = context.propsValue;

    const body = {
      user_agent,
      remote_addr,
      read,
      payment_status,
      field_x,
      encryption_password,
    }
    const response=await makeRequest(
      accessToken,
      HttpMethod.POST,
      `/form/${form_id}/submission.json`,
      body,
      {}
    );

    return response
  },
});
