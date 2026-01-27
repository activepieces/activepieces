import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders, queryWorkbooks } from '../common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

export const refreshWorkbook = createAction({
  name: 'refresh_workbook',
  displayName: 'Refresh Workbook',
  description: 'Refreshes the specified workbook immediately',
  auth: tableauAuth,
  props: {
    workbookId: Property.Dropdown({
 auth: tableauAuth,     displayName: 'Workbook',
      description: 'Select the workbook to refresh',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }

        try {
          const workbooks = await queryWorkbooks(auth as any);

          const options = workbooks.map((workbook: any) => ({
            label: workbook.name || `Workbook ${workbook.id}`,
            value: workbook.id,
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load workbooks. Please check your authentication.',
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { workbookId } = propsValue;
    const tableauAuth = auth as any;

    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    const refreshUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `workbooks/${workbookId}/refresh`);

    const requestBody = '<?xml version="1.0" encoding="UTF-8"?><tsRequest></tsRequest>';

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: refreshUrl,
      headers: {
        ...getTableauHeaders(authToken),
        'Content-Type': 'application/xml',
      },
      body: requestBody,
    });

    if (response.status !== 202) {
      throw new Error(`Failed to refresh workbook: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);

    const jobIdMatch = responseBody.match(/<job[^>]*id="([^"]+)"/);
    const jobId = jobIdMatch ? jobIdMatch[1] : null;

    const modeMatch = responseBody.match(/mode="([^"]+)"/);
    const mode = modeMatch ? modeMatch[1] : null;

    const typeMatch = responseBody.match(/type="([^"]+)"/);
    const type = typeMatch ? typeMatch[1] : null;

    const createdAtMatch = responseBody.match(/createdAt="([^"]+)"/);
    const createdAt = createdAtMatch ? createdAtMatch[1] : null;

    const workbookNameMatch = responseBody.match(/<workbook[^>]*name="([^"]+)"/);
    const workbookName = workbookNameMatch ? workbookNameMatch[1] : null;

    return {
      success: true,
      workbookId,
      workbookName,
      job: {
        id: jobId,
        mode,
        type,
        createdAt,
      },
      message: 'Workbook refresh has been queued successfully',
    };
  },
});

