import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { whatConvertsAuth } from '../common/auth';

const WHATCONVERTS_API_URL = 'https://app.whatconverts.com/api/v1';

export const createExportAction = createAction({
  auth: whatConvertsAuth,
  name: 'create_export',
  displayName: 'Create Export',
  description: 'Generate a new CSV export of leads for a specified date range.',
  props: {
    profile_id: Property.Number({
      displayName: 'Profile ID',
      description: 'The ID of the Profile from which to export leads.',
      required: true,
    }),
    from_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'The start date for the export range in YYYY-MM-DD format.',
      required: true,
    }),
    to_date: Property.ShortText({
      displayName: 'End Date',
      description: 'The end date for the export range in YYYY-MM-DD format.',
      required: true,
    }),
    export_type: Property.ShortText({
      displayName: 'Export Type',
      description:
        'The type of data to export. Defaults to "leads" if left blank.',
      required: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;

    const body: { [key: string]: unknown } = {
      profile_id: propsValue.profile_id,
      from_date: propsValue.from_date,
      to_date: propsValue.to_date,
    };

    if (propsValue.export_type) {
      body['export_type'] = propsValue.export_type; 
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${WHATCONVERTS_API_URL}/exports`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth.api_token,
        password: auth.api_secret as string,
      },
      body: body,
    });

    return response.body;
  },
});
