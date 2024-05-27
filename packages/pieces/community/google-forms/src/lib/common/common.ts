import { Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const googleFormsCommon = {
  include_team_drives: Property.Checkbox({
    displayName: 'Include Team Drive Forms',
    description:
      'Determines if forms from Team Drives should be included in the results.',
    defaultValue: false,
    required: false,
  }),
  form_id: Property.Dropdown({
    displayName: 'Form',
    required: true,
    refreshers: ['include_team_drives'],
    options: async ({ auth, include_team_drives }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authProp: OAuth2PropertyValue = auth as OAuth2PropertyValue;
      const files = (
        await httpClient.sendRequest<{ files: { id: string; name: string }[] }>(
          {
            method: HttpMethod.GET,
            url: `https://www.googleapis.com/drive/v3/files`,
            queryParams: {
              q: "mimeType='application/vnd.google-apps.form'",
              includeItemsFromAllDrives: include_team_drives ? 'true' : 'false',
              supportsAllDrives: 'true',
            },
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: authProp['access_token'],
            },
          }
        )
      ).body.files;
      return {
        disabled: false,
        options: files.map((file: { id: string; name: string }) => {
          return {
            label: file.name,
            value: file.id,
          };
        }),
      };
    },
  }),
};
