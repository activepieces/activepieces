import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon, addRowToSmartsheet } from '../common';

export const addRowToSheet = createAction({
  auth: smartsheetAuth,
  name: 'add_row_to_sheet',
  displayName: 'Add Row to Sheet',
  description: 'Add one or more rows to a Smartsheet with comprehensive options for positioning, formatting, and validation',
  props: {
    sheet_id: smartsheetCommon.sheet_id,
    cells: Property.Array({
      displayName: 'Cells',
      description: 'Array of cell objects with columnId and value. Each cell must have a columnId and either a value or formula.',
      required: true,
      properties: {
        columnId: Property.Number({
          displayName: 'Column ID',
          description: 'The ID of the column this cell belongs to',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'The cell value (use either value or formula, not both)',
          required: false,
        }),
        formula: Property.ShortText({
          displayName: 'Formula',
          description: 'The formula for the cell (use either value or formula, not both)',
          required: false,
        }),
        strict: Property.Checkbox({
          displayName: 'Strict Validation',
          description: 'Set to false to enable lenient parsing of cell values',
          required: false,
          defaultValue: true,
        }),
        overrideValidation: Property.Checkbox({
          displayName: 'Override Validation',
          description: 'Allow cell value outside of validation limits (requires strict=false)',
          required: false,
          defaultValue: false,
        }),
        hyperlink_url: Property.ShortText({
          displayName: 'Hyperlink URL',
          description: 'Optional URL to make this cell a hyperlink',
          required: false,
        }),
        hyperlink_sheet_id: Property.Number({
          displayName: 'Hyperlink Sheet ID',
          description: 'Optional Sheet ID to link to another sheet',
          required: false,
        }),
        hyperlink_report_id: Property.Number({
          displayName: 'Hyperlink Report ID',
          description: 'Optional Report ID to link to a report',
          required: false,
        }),
      },
    }),

    // Location specifiers (one is required)
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

    sibling_id: Property.Number({
      displayName: 'Reference Row ID',
      description: 'Row ID to use as reference for positioning (required for above/below/child positioning)',
      required: false,
    }),

    // Additional row properties
    expanded: Property.Checkbox({
      displayName: 'Expanded',
      description: 'Whether the row should be expanded (for hierarchical rows)',
      required: false,
      defaultValue: true,
    }),

    locked: Property.Checkbox({
      displayName: 'Lock Row',
      description: 'Whether to lock the row after creation',
      required: false,
      defaultValue: false,
    }),

    // Bulk operation options
    allow_partial_success: Property.Checkbox({
      displayName: 'Allow Partial Success',
      description: 'Enable partial success for bulk operations',
      required: false,
      defaultValue: false,
    }),

    override_validation: Property.Checkbox({
      displayName: 'Override Sheet Validation',
      description: 'Allow values outside validation limits (global setting)',
      required: false,
      defaultValue: false,
    }),

    access_api_level: Property.StaticDropdown({
      displayName: 'Access API Level',
      description: 'API access level for the operation',
      required: false,
      defaultValue: '0',
      options: {
        options: [
          { label: 'Viewer (default)', value: '0' },
          { label: 'Commenter', value: '1' },
        ],
      },
    }),
  },

  async run(context) {
    const {
      sheet_id,
      cells,
      location_type,
      sibling_id,
      expanded,
      locked,
      allow_partial_success,
      override_validation,
      access_api_level
    } = context.propsValue;

    // Validate location requirements
    if (['above', 'below', 'child'].includes(location_type as string) && !sibling_id) {
      throw new Error(`Reference Row ID is required when using '${location_type}' positioning`);
    }

    // Transform cells array into proper Smartsheet format
    const transformedCells = (cells as any[]).map((cell: any) => {
      const cellObj: any = {
        columnId: cell.columnId,
      };

      // Add value or formula (not both)
      if (cell.formula) {
        cellObj.formula = cell.formula;
      } else if (cell.value !== undefined && cell.value !== '') {
        cellObj.value = cell.value;
      }

      // Add validation settings
      if (cell.strict !== undefined) {
        cellObj.strict = cell.strict;
      }
      if (cell.overrideValidation) {
        cellObj.overrideValidation = cell.overrideValidation;
      }

      // Add hyperlink if specified
      if (cell.hyperlink_url || cell.hyperlink_sheet_id || cell.hyperlink_report_id) {
        cellObj.hyperlink = {};
        if (cell.hyperlink_url) cellObj.hyperlink.url = cell.hyperlink_url;
        if (cell.hyperlink_sheet_id) cellObj.hyperlink.sheetId = cell.hyperlink_sheet_id;
        if (cell.hyperlink_report_id) cellObj.hyperlink.reportId = cell.hyperlink_report_id;
      }

      return cellObj;
    });

    // Build the row object with location specifiers
    const rowObj: any = {
      cells: transformedCells,
    };

    // Add location specifiers based on location_type
    switch (location_type) {
      case 'top':
        rowObj.toTop = true;
        break;
      case 'bottom':
        rowObj.toBottom = true;
        break;
      case 'above':
        rowObj.siblingId = sibling_id;
        rowObj.above = true;
        break;
      case 'below':
        rowObj.siblingId = sibling_id;
        break;
      case 'child':
        rowObj.parentId = sibling_id;
        break;
    }

    // Add optional row properties
    if (expanded !== undefined) {
      rowObj.expanded = expanded;
    }
    if (locked !== undefined) {
      rowObj.locked = locked;
    }

    // Build query parameters
    const queryParams: any = {};
    if (allow_partial_success) {
      queryParams.allowPartialSuccess = true;
    }
    if (override_validation) {
      queryParams.overrideValidation = true;
    }
    if (access_api_level && access_api_level !== '0') {
      queryParams.accessApiLevel = parseInt(access_api_level as string);
    }

    const rowPayload = [rowObj];

    try {
      const result = await addRowToSmartsheet(
        context.auth as string,
        sheet_id as string,
        rowPayload,
        queryParams
      );

      return {
        success: true,
        row: result,
        message: 'Row added successfully',
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorBody = error.response.data;
        throw new Error(`Bad Request: ${errorBody.message || 'Invalid row data or parameters'}`);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to add rows to this sheet');
      } else if (error.response?.status === 404) {
        throw new Error('Sheet not found or you do not have access to it');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to add row: ${error.message}`);
    }
  },
});
