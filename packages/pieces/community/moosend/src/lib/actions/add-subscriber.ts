import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { moosendAuth } from '../common/auth';
import { moosendApiCall } from '../common/client';

export const addSubscriber = createAction({
  auth: moosendAuth,
  name: 'add_subscriber',
  displayName: 'Add Subscriber',
  description: 'Add or update a subscriber on a Moosend mailing list.',
  props: {
    mailing_list_id: Property.ShortText({
      displayName: 'Mailing List ID',
      description: 'The ID of the mailing list.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the subscriber.',
      required: false,
    }),
    custom_fields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields as [{"Name":"field","Value":"val"}].',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const body: Record<string, unknown> = {
      Email: props.email,
    };
    if (props.name) body['Name'] = props.name;
    if (props.custom_fields && props.custom_fields.length > 0) {
      body['CustomFields'] = props.custom_fields;
    }

    const response = await moosendApiCall<{ Context: Record<string, unknown> }>({
      method: HttpMethod.POST,
      path: `subscribers/${props.mailing_list_id}/subscribe.json`,
      auth: context.auth,
      body,
    });

    return response.body.Context;
  },
});
