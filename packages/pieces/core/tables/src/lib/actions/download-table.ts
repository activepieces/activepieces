import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { tablesCommon, csvUtils } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { ExportTableResponse } from '@activepieces/shared';

export const downloadTable = createAction({
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

    const response = await httpClient.sendRequest<ExportTableResponse>({
      method: HttpMethod.GET,
      url: `${context.server.apiUrl}v1/tables/${tableId}/export`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.server.token,
      },
      retries: 5,
    });

    const { fields, rows, name } = response.body;
    const csvContent = csvUtils.buildCsv({
      fields,
      rows,
      includeHeaders: includeHeaders ?? true,
    });

    const file = await context.files.write({
      fileName: `${name}.csv`,
      data: Buffer.from(csvContent, 'utf-8'),
    });

    return { file, name: `${name}.csv` };
  },
});
