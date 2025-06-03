import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon, updateRowInSmartsheet } from '../common';

export const updateRow = createAction({
  auth: smartsheetAuth,
  name: 'update_row',
  displayName: 'Update Row',
  description: 'Update cell values, positioning, or properties of existing rows in a Smartsheet with comprehensive options',
  props: {
    sheet_id: smartsheetCommon.sheet_id,

    row_id: smartsheetCommon.row_id,

    cells: smartsheetCommon.cells,

    position_type: Property.StaticDropdown({
      displayName: 'Change Position',
      description: 'Optionally change the position of this row',
      required: false,
      options: {
        options: [
          { label: 'No change', value: 'none' },
          { label: 'Move to top', value: 'top' },
          { label: 'Move to bottom', value: 'bottom' },
          { label: 'Move above specific row', value: 'above' },
          { label: 'Move below specific row', value: 'below' },
          { label: 'Make child of parent row', value: 'child' },
          { label: 'Indent (make child of above row)', value: 'indent' },
          { label: 'Outdent (reduce indentation)', value: 'outdent' },
        ],
      },
    }),

    reference_row_id: {
      ...smartsheetCommon.row_id,
      displayName: 'Reference Row',
      description: 'Row to use as reference for positioning (required for above/below/child positioning)',
      required: false,
    },

    expanded: Property.Checkbox({
      displayName: 'Expanded',
      description: 'Whether the row should be expanded (for hierarchical rows)',
      required: false,
    }),

    locked: Property.Checkbox({
      displayName: 'Lock Row',
      description: 'Whether to lock or unlock the row',
      required: false,
    }),

    row_format: Property.ShortText({
      displayName: 'Row Format',
      description: 'Format descriptor for the entire row (advanced users)',
      required: false,
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
  },

  async run(context) {
    const {
      sheet_id,
      row_id,
      cells,
      position_type,
      reference_row_id,
      expanded,
      locked,
      row_format,
      access_api_level,
      allow_partial_success,
      override_validation,
    } = context.propsValue;

    if (['above', 'below', 'child'].includes(position_type as string) && !reference_row_id) {
      throw new Error(`Reference Row ID is required when using '${position_type}' positioning`);
    }

    const rowObj: any = {
      id: row_id,
    };

    // Transform dynamic cells data into proper Smartsheet format
    const cellsData = cells as Record<string, any>;
    const transformedCells: any[] = [];

    for (const [key, value] of Object.entries(cellsData)) {
      if (value === undefined || value === null || value === '') {
        continue; // Skip empty values
      }

      let columnId: number;
      const cellObj: any = {};

      if (key.startsWith('column_')) {
        // Regular column value
        columnId = parseInt(key.replace('column_', ''));
        cellObj.columnId = columnId;
        cellObj.value = value;
      } else if (key.startsWith('formula_')) {
        // Formula value
        columnId = parseInt(key.replace('formula_', ''));
        cellObj.columnId = columnId;
        cellObj.formula = value;
      } else if (key.startsWith('hyperlink_url_')) {
        // Hyperlink URL
        columnId = parseInt(key.replace('hyperlink_url_', ''));
        // Find existing cell or create new one
        let existingCell = transformedCells.find(cell => cell.columnId === columnId);
        if (!existingCell) {
          existingCell = { columnId, hyperlink: {} };
          transformedCells.push(existingCell);
        }
        if (!existingCell.hyperlink) existingCell.hyperlink = {};
        existingCell.hyperlink.url = value;
        continue; // Don't add as separate cell
      } else if (key.startsWith('hyperlink_sheet_')) {
        // Hyperlink to sheet
        columnId = parseInt(key.replace('hyperlink_sheet_', ''));
        // Find existing cell or create new one
        let existingCell = transformedCells.find(cell => cell.columnId === columnId);
        if (!existingCell) {
          existingCell = { columnId, hyperlink: {} };
          transformedCells.push(existingCell);
        }
        if (!existingCell.hyperlink) existingCell.hyperlink = {};
        existingCell.hyperlink.sheetId = value;
        continue; // Don't add as separate cell
      } else if (key.startsWith('hyperlink_report_')) {
        // Hyperlink to report
        columnId = parseInt(key.replace('hyperlink_report_', ''));
        // Find existing cell or create new one
        let existingCell = transformedCells.find(cell => cell.columnId === columnId);
        if (!existingCell) {
          existingCell = { columnId, hyperlink: {} };
          transformedCells.push(existingCell);
        }
        if (!existingCell.hyperlink) existingCell.hyperlink = {};
        existingCell.hyperlink.reportId = value;
        continue; // Don't add as separate cell
      } else if (key.startsWith('strict_')) {
        // Strict parsing setting
        columnId = parseInt(key.replace('strict_', ''));
        // Find existing cell or create new one
        let existingCell = transformedCells.find(cell => cell.columnId === columnId);
        if (!existingCell) {
          existingCell = { columnId };
          transformedCells.push(existingCell);
        }
        existingCell.strict = value;
        continue; // Don't add as separate cell
      } else if (key.startsWith('override_validation_')) {
        // Override validation setting
        columnId = parseInt(key.replace('override_validation_', ''));
        // Find existing cell or create new one
        let existingCell = transformedCells.find(cell => cell.columnId === columnId);
        if (!existingCell) {
          existingCell = { columnId };
          transformedCells.push(existingCell);
        }
        existingCell.overrideValidation = value;
        continue; // Don't add as separate cell
      } else {
        continue; // Skip unknown keys
      }

      transformedCells.push(cellObj);
    }

    // Only add cells array if we have cells to update
    if (transformedCells.length > 0) {
      rowObj.cells = transformedCells;
    }

    if (position_type && position_type !== 'none') {
      switch (position_type) {
        case 'top':
          rowObj.toTop = true;
          break;
        case 'bottom':
          rowObj.toBottom = true;
          break;
        case 'above':
          rowObj.siblingId = reference_row_id;
          rowObj.above = true;
          break;
        case 'below':
          rowObj.siblingId = reference_row_id;
          break;
        case 'child':
          rowObj.parentId = reference_row_id;
          break;
        case 'indent':
          rowObj.indent = 1;
          break;
        case 'outdent':
          rowObj.outdent = 1;
          break;
      }
    }

    if (expanded !== undefined) {
      rowObj.expanded = expanded;
    }
    if (locked !== undefined) {
      rowObj.locked = locked;
    }
    if (row_format) {
      rowObj.format = row_format;
    }

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

    try {
      const result = await updateRowInSmartsheet(
        context.auth as string,
        sheet_id as string,
        [rowObj],
        queryParams
      );

      return {
        success: true,
        row: result,
        message: 'Row updated successfully',
        cells_processed: transformedCells.length,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorBody = error.response.data;
        throw new Error(`Bad Request: ${errorBody.message || 'Invalid row data or parameters'}`);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to update rows in this sheet');
      } else if (error.response?.status === 404) {
        throw new Error('Sheet not found or you do not have access to it');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      throw new Error(`Failed to update row: ${error.message}`);
    }
  }
});
