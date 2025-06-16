import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsheetApiCall } from '../common/client';
import { smartsheetAuth } from '../../index';
import { sheetDropdown, columnDropdown } from '../common/props';

interface RowPayload {
  expanded?: boolean;
  locked?: boolean;
  strict?: boolean;
  accessLevel?: string;
  cells: {
    columnId: number;
    value: unknown;
    formula?: string;
    hyperlink?: unknown;
    linkInFromCell?: unknown;
    format?: string;
  }[];
  attachments?: unknown[];
  discussions?: unknown[];
  proof?: unknown;
  version?: number;
  format?: string;
  indent?: boolean;
  outdent?: boolean;
  filteredOut?: boolean;
  rowNumber?: number;
  permaLink?: string;
  conditionalFormat?: string;
  toTop?: boolean;
  toBottom?: boolean;
  siblingId?: number;
  above?: boolean;
  parentId?: number;
}

interface CellPayload {
  columnId: number;
  value: unknown;
  formula?: string;
  hyperlink?: unknown;
  linkInFromCell?: unknown;
  format?: string;
}


export const addRowAction = createAction({
  auth: smartsheetAuth,
  name: 'add_row',
  displayName: 'Add Row',
  description: 'Adds a new row to a selected Smartsheet sheet.',
  props: {
    sheetId: sheetDropdown(true),
    cells: columnDropdown(true),
    location_type: Property.StaticDropdown({
      displayName: 'Row Position',
      description: 'Where to insert the new row',
      required: true,
      defaultValue: 'bottom',
      options: {
        options: [
          { label: 'Top of sheet', value: 'top' },
          { label: 'Bottom of sheet', value: 'bottom' },
          { label: 'Above specific row', value: 'above' },
          { label: 'Below specific row', value: 'below' },
          { label: 'As child of parent row', value: 'child' },
        ],
      },
    }),
    referenceRowId: Property.Number({
      displayName: 'Reference Row ID',
      description: 'Used for siblingId or parentId based on location type.',
      required: false,
    }),
    accessLevel: Property.StaticDropdown({
      displayName: 'Access Level',
      required: false,
      options: {
        options: [
          { label: 'ADMIN', value: 'ADMIN' },
          { label: 'COMMENTER', value: 'COMMENTER' },
          { label: 'EDITOR', value: 'EDITOR' },
          { label: 'EDITOR_SHARE', value: 'EDITOR_SHARE' },
          { label: 'OWNER', value: 'OWNER' },
          { label: 'VIEWER', value: 'VIEWER' },
        ],
      },
    }),
    attachments: Property.Json({
      displayName: 'Attachments (array)',
      description: 'Array of attachment objects',
      required: false,
    }),
    discussions: Property.Json({
      displayName: 'Discussions (array)',
      description: 'Array of discussion objects',
      required: false,
    }),
    proof: Property.Json({
      displayName: 'Proof object',
      description: 'Media review/approval object',
      required: false,
    }),
    expanded: Property.Checkbox({
      displayName: 'Expanded',
      required: false,
    }),
    locked: Property.Checkbox({
      displayName: 'Lock Row',
      required: false,
    }),
    strict: Property.Checkbox({
      displayName: 'Strict Mode',
      required: false,
    }),
    overrideValidation: Property.Checkbox({
      displayName: 'Override Validation',
      required: false,
    }),
    allowPartialSuccess: Property.Checkbox({
      displayName: 'Allow Partial Success',
      required: false,
    }),
    version: Property.Number({
      displayName: 'Sheet Version',
      required: false,
    }),
    format: Property.ShortText({
      displayName: 'Row Format',
      description: 'Format descriptor string',
      required: false,
    }),
    indent: Property.Checkbox({
      displayName: 'Indent',
      description: 'Indent the row',
      required: false,
    }),
    outdent: Property.Checkbox({
      displayName: 'Outdent',
      description: 'Outdent the row',
      required: false,
    }),
    filteredOut: Property.Checkbox({
      displayName: 'Filtered Out',
      description: 'Is the row filtered out?',
      required: false,
    }),
    rowNumber: Property.Number({
      displayName: 'Row Number',
      description: 'Row number within the sheet',
      required: false,
    }),
    permaLink: Property.ShortText({
      displayName: 'Permalink',
      description: 'Direct link to the row',
      required: false,
    }),
    conditionalFormat: Property.ShortText({
      displayName: 'Conditional Format',
      description: 'Row conditional format string',
      required: false,
    }),
    cellFormula: Property.Json({
      displayName: 'Cell Formulas (object)',
      description: 'Object mapping columnId to formula',
      required: false,
    }),
    cellHyperlink: Property.Json({
      displayName: 'Cell Hyperlinks (object)',
      description: 'Object mapping columnId to hyperlink object',
      required: false,
    }),
    cellLinkInFromCell: Property.Json({
      displayName: 'Cell LinkInFromCell (object)',
      description: 'Object mapping columnId to linkInFromCell object',
      required: false,
    }),
    cellFormat: Property.Json({
      displayName: 'Cell Format (object)',
      description: 'Object mapping columnId to format string',
      required: false,
    }),
  },
  async run(context) {
    const {
      sheetId,
      cells,
      location_type,
      referenceRowId,
      expanded,
      locked,
      strict,
      accessLevel,
      attachments,
      discussions,
      proof,
      overrideValidation,
      allowPartialSuccess,
      version,
      format,
      indent,
      outdent,
      filteredOut,
      rowNumber,
      permaLink,
      conditionalFormat,
      cellFormula,
      cellHyperlink,
      cellLinkInFromCell,
      cellFormat,
    } = context.propsValue;

    const { apiKey, region } = context.auth;

    const queryParams: Record<string, string> = {};
    if (overrideValidation) queryParams['overrideValidation'] = 'true';
    if (allowPartialSuccess) queryParams['allowPartialSuccess'] = 'true';

    const cellsPayload = Object.entries(cells || {}).map(([columnId, value]) => {
      const cell: CellPayload = { columnId: +columnId, value };

      if (cellFormula && typeof cellFormula[columnId] === 'string') cell.formula = cellFormula[columnId];
      if (cellHyperlink && cellHyperlink[columnId]) cell.hyperlink = cellHyperlink[columnId];
      if (cellLinkInFromCell && cellLinkInFromCell[columnId]) cell.linkInFromCell = cellLinkInFromCell[columnId];
      if (cellFormat && typeof cellFormat[columnId] === 'string') cell.format = cellFormat[columnId];

      return cell;
    });

    const rowPayload: RowPayload = {
      expanded,
      locked,
      strict,
      accessLevel,
      cells: cellsPayload,
      attachments: Array.isArray(attachments) ? attachments : undefined,
      discussions: Array.isArray(discussions) ? discussions : undefined,
      proof,
      version,
      format,
      indent,
      outdent,
      filteredOut,
      rowNumber,
      permaLink,
      conditionalFormat,
    };

    if (location_type === 'top') rowPayload.toTop = true;
    if (location_type === 'bottom') rowPayload.toBottom = true;
    if (location_type === 'above' && referenceRowId) {
      rowPayload.siblingId = referenceRowId;
      rowPayload.above = true;
    }
    if (location_type === 'below' && referenceRowId) {
      rowPayload.siblingId = referenceRowId;
    }
    if (location_type === 'child' && referenceRowId) {
      rowPayload.parentId = referenceRowId;
    }

    const response = await smartsheetApiCall({
      apiKey,
      region: region as 'default' | 'gov' | 'eu' | 'au' | undefined,
      method: HttpMethod.POST,
      resourceUri: `/sheets/${sheetId}/rows`,
      query: queryParams,
      body: [rowPayload],
    });

    return response;
  },
});
