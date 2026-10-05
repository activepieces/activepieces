import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpError, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveListDriveChangesOutputSchema } from '../output-schemas';

export const onedriveListDriveChanges = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_drive_changes',
  displayName: 'List Drive Changes (Delta)',
  description: 'List items that changed in the drive since a saved delta token, one page at a time.',
  audience: 'ai',
  outputSchema: onedriveListDriveChangesOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Track changes across the whole drive, one page per call: with no token it enumerates every item, with a token it returns only items created, changed or deleted since then (deleted items have deleted = true). Keep calling with nextPageToken until it is null, then save deltaToken and pass it on a later call to get the next changes; set Start From Now to skip the full enumeration and get a deltaToken only. If a token has expired, the action fails and you must start again without a token.',
    idempotent: true,
  },
  props: {
    pageToken: Property.ShortText({
      displayName: 'Page or Delta Token',
      description: 'nextPageToken or deltaToken from a previous call. Empty to start.',
      required: false,
    }),
    startFromNow: Property.Checkbox({
      displayName: 'Start From Now',
      description: 'Without a token, skip current items and return only a deltaToken.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { pageToken, startFromNow } = context.propsValue;
    const token = pageToken?.trim();
    const graphPrefix = graphV1Prefix({ auth: context.auth });
    if (token && !token.startsWith(graphPrefix)) {
      throw new Error('The token is not a valid OneDrive delta link. Pass the nextPageToken or deltaToken from a previous call unchanged.');
    }
    const response = await fetchDeltaPage({
      auth: context.auth,
      url: token ? token : `${graphPrefix}me/drive/root/delta`,
      queryParams: !token && startFromNow ? { token: 'latest' } : undefined,
    });
    const items = response.value.map((item) => oneDriveApi.toItem(item));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
      deltaToken: response['@odata.deltaLink'] ?? null,
    };
  },
});

async function fetchDeltaPage({
  auth,
  url,
  queryParams,
}: {
  auth: OAuth2PropertyValue;
  url: string;
  queryParams?: QueryParams;
}): Promise<GraphDeltaPage> {
  try {
    const response = await httpClient.sendRequest<GraphDeltaPage>({
      method: HttpMethod.GET,
      url,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError && error.response.status === 410) {
      throw new Error('The delta token has expired or is no longer valid. Call this action again with no token to restart the enumeration from the beginning.');
    }
    throw new Error(oneDriveApi.describeError(error));
  }
}

function graphV1Prefix({ auth }: { auth: OAuth2PropertyValue }): string {
  const cloud = auth.props?.['cloud'];
  return `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0/`;
}

type GraphDeltaPage = {
  value: GraphDriveItem[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
};
