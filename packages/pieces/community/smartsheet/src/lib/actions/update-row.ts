import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from '../common/client';
import { smartsheetAuth } from '../../index';

interface Cell {
  columnId: number;
  value?: unknown;
  formula?: string;
  hyperlink?: unknown;
  linkInFromCell?: unknown;
  image?: unknown;
  format?: string;
  overrideValidation?: boolean;
}

interface Row {
  id: number;
  cells: Cell[];
  siblingId?: number;
  expanded?: boolean;
  locked?: boolean;
  format?: string;
  accessLevel?: string;
  attachments?: unknown[];
  discussions?: unknown[];
  proof?: unknown;
  indent?: boolean;
  outdent?: boolean;
  filteredOut?: boolean;
  rowNumber?: number;
  permaLink?: string;
  conditionalFormat?: string;
}

export const updateRowAction = createAction({
  auth: smartsheetAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Modify task statuses or details based on external triggers.',
  props: {
    sheetId: Property.Number({
      displayName: 'Sheet ID',
      required: true,
    }),
    rows: Property.Json({
      displayName: 'Rows',
      description:
        'Provide one or more row objects with full attributes such as id, cells, siblingId, expanded, locked, format, accessLevel, attachments, discussions, proof, indent, outdent, filteredOut, rowNumber, permaLink, conditionalFormat, etc. Each cell can have value, formula, hyperlink, linkInFromCell, image, format, and overrideValidation.',
      required: true,
    }),
    allowPartialSuccess: Property.Checkbox({
      displayName: 'Allow Partial Success',
      required: false,
      defaultValue: false,
    }),
    overrideValidation: Property.Checkbox({
      displayName: 'Override Validation',
      required: false,
      defaultValue: false,
    }),
    strict: Property.Checkbox({
      displayName: 'Strict Value Parsing',
      required: false,
      defaultValue: true,
    }),
    accessApiLevel: Property.Number({
      displayName: 'Access API Level',
      description: 'Allows COMMENTER access for inputs and return values. Default is 0 (VIEWER).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { sheetId, rows, allowPartialSuccess, overrideValidation, strict, accessApiLevel } = context.propsValue;
    const { apiKey, region } = context.auth;

    const queryParams: Record<string, string> = {};
    if (allowPartialSuccess) queryParams['allowPartialSuccess'] = 'true';
    if (overrideValidation) queryParams['overrideValidation'] = 'true';
    if (strict === false) queryParams['strict'] = 'false';
    if (typeof accessApiLevel === 'number') queryParams['accessApiLevel'] = String(accessApiLevel);

    const response = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.PUT,
      resourceUri: `/sheets/${sheetId}/rows`,
      body: rows as unknown as Row[],
      query: queryParams,
    });

    return response;
  },
});
