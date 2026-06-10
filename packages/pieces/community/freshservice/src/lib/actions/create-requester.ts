import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../';
import { freshserviceApiCall } from '../common/client';
import { freshserviceCommon } from '../common/props';

export const createRequester = createAction({
  auth: freshserviceAuth,
  name: 'create_requester',
  displayName: 'Create Requester',
  description: 'Creates a new requester (end user) in Freshservice.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the requester.',
      required: true,
    }),
    primary_email: Property.ShortText({
      displayName: 'Email',
      description: 'The primary email address of the requester.',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the requester.',
      required: false,
    }),
    job_title: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the requester.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Work Phone',
      description: 'The work phone number of the requester.',
      required: false,
    }),
    mobile_phone_number: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'The mobile phone number of the requester.',
      required: false,
    }),
    department_id: freshserviceCommon.department(false),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'A JSON object of custom field names and values.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;

    const requesterBody: Record<string, unknown> = {
      first_name: props.first_name,
      primary_email: props.primary_email,
    };

    if (props.last_name) requesterBody['last_name'] = props.last_name;
    if (props.job_title) requesterBody['job_title'] = props.job_title;
    if (props.phone) requesterBody['phone'] = props.phone;
    if (props.mobile_phone_number)
      requesterBody['mobile_phone_number'] = props.mobile_phone_number;
    if (props.department_id)
      requesterBody['department_ids'] = [props.department_id];
    if (props.custom_fields)
      requesterBody['custom_fields'] = props.custom_fields;

    const response = await freshserviceApiCall<{ requester: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: 'requesters',
      auth: context.auth,
      body: requesterBody,
    });

    return response.body.requester;
  },
});
