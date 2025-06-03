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
    cells: smartsheetCommon.cells,

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

    sibling_id: {
      ...smartsheetCommon.row_id,
      displayName: 'Reference Row',
      description: 'Row to use as reference for positioning (required for above/below/child positioning)',
      required: false,
    },

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

    if (transformedCells.length === 0) {
      throw new Error('At least one cell value must be provided');
    }

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
        cells_processed: transformedCells.length,
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
  }
});
