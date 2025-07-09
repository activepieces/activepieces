import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wufooApiCall } from '../common/client';
import { wufooAuth } from '../../index';
import { formIdentifier } from '../common/props';

export const findFormAction = createAction({
  auth: wufooAuth,
  name: 'find-form',
  displayName: 'Find Form by Name or Hash',
  description: 'Retrieve form details by name or hash (identifier).',
  props: {
    formIdentifier: formIdentifier,
    format: Property.StaticDropdown({
      displayName: 'Response Format',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'XML', value: 'xml' },
        ],
      },
    }),
    includeTodayCount: Property.Checkbox({
      displayName: 'Include Today Count',
      description: 'Include the number of entries submitted today.',
      required: false,
      defaultValue: false,
    }),
    pretty: Property.Checkbox({
      displayName: 'Pretty Print',
      description: 'Format the response for readability.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { formIdentifier, format, includeTodayCount, pretty } = context.propsValue;

    const response = await wufooApiCall({
      method: HttpMethod.GET,
      auth: context.auth,
      resourceUri: `/forms/${formIdentifier}.${format}`,
      query: {
        includeTodayCount: includeTodayCount ? 'true' : 'false',
        pretty: pretty ? 'true' : 'false',
      },
    });

    return response;
  },
});
