import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';

export const downloadTable = createAction({
  audience: 'human',
  name: 'tables-download-table',
  displayName: 'Download Table',
  description: 'Export a table as a CSV file.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
    include_headers: Property.Checkbox({
      displayName: 'Include Headers',
      description:
        'Whether to include column headers as the first row of the CSV.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { table_id: tableExternalId, include_headers: includeHeaders } =
      context.propsValue;
    const tableId = await tablesCommon.convertTableExternalIdToId(
      tableExternalId,
      context
    );

    const response = await httpClient.sendRequest<DownloadTableResponse>({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/tables/${tableId}/export/csv`,
      queryParams: {
        includeHeaders: String(includeHeaders ?? true),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      timeout: 120000,
    });

    return {
      file: response.body.url,
      name: response.body.name,
      rowCount: response.body.rowCount,
    };
  },
});

type DownloadTableResponse = {
  url: string;
  name: string;
  rowCount: number;
};
