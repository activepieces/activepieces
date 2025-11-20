import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders } from '../common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

export const findView = createAction({
  name: 'find_view',
  displayName: 'Find View',
  description: 'Finds a view based on name (URL name)',
  auth: tableauAuth,
  props: {
    viewName: Property.ShortText({
      displayName: 'View Name',
      description: 'The URL name of the view to find (e.g., Sheet1 from /views/workbook/Sheet1)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { viewName } = propsValue;
    const tableauAuth = auth as any;

    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    const findViewUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `views?filter=viewUrlName:eq:${encodeURIComponent(viewName)}`);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: findViewUrl,
      headers: getTableauHeaders(authToken),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to find view: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);

    const viewIdMatch = responseBody.match(/<view[^>]*id="([^"]+)"/);
    const viewId = viewIdMatch ? viewIdMatch[1] : null;

    const nameMatch = responseBody.match(/name="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : null;

    const contentUrlMatch = responseBody.match(/contentUrl="([^"]+)"/);
    const contentUrl = contentUrlMatch ? contentUrlMatch[1] : null;

    const createdAtMatch = responseBody.match(/createdAt="([^"]+)"/);
    const createdAt = createdAtMatch ? createdAtMatch[1] : null;

    const updatedAtMatch = responseBody.match(/updatedAt="([^"]+)"/);
    const updatedAt = updatedAtMatch ? updatedAtMatch[1] : null;

    const viewUrlNameMatch = responseBody.match(/viewUrlName="([^"]+)"/);
    const viewUrlName = viewUrlNameMatch ? viewUrlNameMatch[1] : null;

    const workbookIdMatch = responseBody.match(/<workbook[^>]*id="([^"]+)"/);
    const workbookId = workbookIdMatch ? workbookIdMatch[1] : null;

    const ownerIdMatch = responseBody.match(/<owner[^>]*id="([^"]+)"/);
    const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

    const projectIdMatch = responseBody.match(/<project[^>]*id="([^"]+)"/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    if (!viewId) {
      throw new Error(`View with name "${viewName}" not found`);
    }

    return {
      success: true,
      view: {
        id: viewId,
        name,
        contentUrl,
        createdAt,
        updatedAt,
        viewUrlName,
        workbook: workbookId ? { id: workbookId } : null,
        owner: ownerId ? { id: ownerId } : null,
        project: projectId ? { id: projectId } : null,
        tags: [],
      },
      message: `View "${viewName}" found successfully`,
    };
  },
});

