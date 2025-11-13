import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tableauAuth } from '../../index';
import { getAuthToken, buildTableauUrl, getTableauHeaders } from '../common';

function ensureString(body: any): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object') return JSON.stringify(body);
  return String(body);
}

export const findWorkbook = createAction({
  name: 'find_workbook',
  displayName: 'Find Workbook',
  description: 'Finds a workbook based on ID or content URL',
  auth: tableauAuth,
  props: {
    searchType: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Choose whether to search by workbook ID or content URL',
      required: true,
      options: {
        options: [
          { label: 'Workbook ID', value: 'id' },
          { label: 'Content URL', value: 'contentUrl' },
        ],
      },
    }),
    workbookId: Property.ShortText({
      displayName: 'Workbook ID',
      description: 'The ID of the workbook to find',
      required: false,
    }),
    contentUrl: Property.ShortText({
      displayName: 'Content URL',
      description: 'The content URL of the workbook to find (e.g., "MyWorkbook" from /workbooks/MyWorkbook)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { searchType, workbookId, contentUrl } = propsValue;
    const tableauAuth = auth as any;

    if (searchType === 'id' && !workbookId) {
      throw new Error('Workbook ID is required when searching by ID');
    }
    if (searchType === 'contentUrl' && !contentUrl) {
      throw new Error('Content URL is required when searching by content URL');
    }

    const { token: authToken, siteId } = await getAuthToken(tableauAuth);

    const apiVersion = tableauAuth.apiVersion || '3.26';
    let findWorkbookUrl: string;
    if (searchType === 'id') {
      findWorkbookUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `workbooks/${workbookId}`);
    } else {
      findWorkbookUrl = buildTableauUrl(tableauAuth.serverUrl, apiVersion, siteId, `workbooks/${encodeURIComponent(contentUrl!)}?key=contentUrl`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: findWorkbookUrl,
      headers: getTableauHeaders(authToken),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to find workbook: ${response.status} - ${response.body}`);
    }

    const responseBody = ensureString(response.body);

    const workbookIdMatch = responseBody.match(/<workbook[^>]*id="([^"]+)"/);
    const foundWorkbookId = workbookIdMatch ? workbookIdMatch[1] : null;

    const nameMatch = responseBody.match(/name="([^"]+)"/);
    const name = nameMatch ? nameMatch[1] : null;

    const descriptionMatch = responseBody.match(/description="([^"]*)"/);
    const description = descriptionMatch ? descriptionMatch[1] : '';

    const workbookContentUrlMatch = responseBody.match(/contentUrl="([^"]+)"/);
    const workbookContentUrl = workbookContentUrlMatch ? workbookContentUrlMatch[1] : null;

    const webpageUrlMatch = responseBody.match(/webpageUrl="([^"]+)"/);
    const webpageUrl = webpageUrlMatch ? webpageUrlMatch[1] : null;

    const showTabsMatch = responseBody.match(/showTabs="([^"]+)"/);
    const showTabs = showTabsMatch ? showTabsMatch[1] : null;

    const sizeMatch = responseBody.match(/size="([^"]+)"/);
    const size = sizeMatch ? sizeMatch[1] : null;

    const createdAtMatch = responseBody.match(/createdAt="([^"]+)"/);
    const createdAt = createdAtMatch ? createdAtMatch[1] : null;

    const updatedAtMatch = responseBody.match(/updatedAt="([^"]+)"/);
    const updatedAt = updatedAtMatch ? updatedAtMatch[1] : null;

    const encryptExtractsMatch = responseBody.match(/encryptExtracts="([^"]+)"/);
    const encryptExtracts = encryptExtractsMatch ? encryptExtractsMatch[1] : null;

    const defaultViewIdMatch = responseBody.match(/defaultViewId="([^"]+)"/);
    const defaultViewId = defaultViewIdMatch ? defaultViewIdMatch[1] : null;

    const projectIdMatch = responseBody.match(/<project[^>]*id="([^"]+)"/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    const projectNameMatch = responseBody.match(/<project[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>/);
    const projectName = projectNameMatch ? projectNameMatch[1] : null;

    const ownerIdMatch = responseBody.match(/<owner[^>]*id="([^"]+)"/);
    const ownerId = ownerIdMatch ? ownerIdMatch[1] : null;

    const ownerNameMatch = responseBody.match(/<owner[^>]*>[\s\S]*?<name[^>]*>([^<]+)<\/name>/);
    const ownerName = ownerNameMatch ? ownerNameMatch[1] : null;

    const views: any[] = [];
    const viewMatches = responseBody.matchAll(/<view[^>]*id="([^"]+)"[^>]*name="([^"]+)"[^>]*contentUrl="([^"]+)"/g);

    for (const match of viewMatches) {
      const [, viewId, viewName, viewContentUrl] = match;
      views.push({
        id: viewId,
        name: viewName,
        contentUrl: viewContentUrl,
      });
    }

    if (!foundWorkbookId) {
      const searchValue = searchType === 'id' ? workbookId : contentUrl;
      throw new Error(`Workbook with ${searchType} "${searchValue}" not found`);
    }

    return {
      success: true,
      workbook: {
        id: foundWorkbookId,
        name,
        description,
        contentUrl: workbookContentUrl,
        webpageUrl,
        showTabs: showTabs === 'true',
        size: size ? parseInt(size) : null,
        createdAt,
        updatedAt,
        encryptExtracts: encryptExtracts === 'true',
        defaultViewId,
        project: projectId ? { id: projectId, name: projectName } : null,
        owner: ownerId ? { id: ownerId, name: ownerName } : null,
        views,
        tags: [],
      },
      searchType,
      searchValue: searchType === 'id' ? workbookId : contentUrl,
      message: `Workbook found successfully`,
    };
  },
});
