import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall, flodeskCommon } from '../common';

export const createSubscriberAction = createAction({
  auth: flodeskAuth,
  name: 'create_subscriber',
  displayName: 'Create or Update Subscriber',
  description: 'Create a new subscriber or update an existing subscriber in Flodesk.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Unconfirmed', value: 'unconfirmed' },
        ],
      },
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      required: false,
      description: 'Key-value pairs for subscriber custom fields.',
    }),
    segments: flodeskCommon.segments_multi(false),
    double_optin: Property.StaticDropdown({
      displayName: 'Require Double Opt-In',
      description: 'Choose whether to require double opt-in, bypass it, or use your Flodesk account default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes (Require Double Opt-In)', value: 'true' },
          { label: 'No (Direct Opt-In)', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const body: Record<string, unknown> = {
      email: props.email,
    };

    if (props.first_name !== undefined && props.first_name !== '') {
      body['first_name'] = props.first_name;
    }
    if (props.last_name !== undefined && props.last_name !== '') {
      body['last_name'] = props.last_name;
    }
    if (props.status) {
      body['status'] = props.status;
    }
    if (props.custom_fields && Object.keys(props.custom_fields).length > 0) {
      body['custom_fields'] = props.custom_fields;
    }
    if (props.segments && props.segments.length > 0) {
      body['segment_ids'] = props.segments;
    }
    if (props.double_optin !== undefined && props.double_optin !== null) {
      body['double_optin'] = props.double_optin === 'true';
    }

    const response = await flodeskApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/subscribers',
      body,
    });

    return response;
  },
});
