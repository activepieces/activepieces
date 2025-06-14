import { createAction, Property } from '@activepieces/pieces-framework';
import { smartsheetAuth } from '../../index';
import { smartsheetCommon, updateRowInSmartsheet } from '../common';

export const updateMultipleRows = createAction({
  auth: smartsheetAuth,
  name: 'update_multiple_rows',
  displayName: 'Update Multiple Rows',
  description: 'Update multiple rows in a Smartsheet with bulk operations support',
  props: {
    sheet_id: smartsheetCommon.sheet_id,

    rows_data: Property.LongText({
      displayName: 'Rows Data (JSON)',
      description: 'JSON array of row objects to update. Each row must have an "id" and optionally "cells", "expanded", "locked", etc. Example: [{"id": 123, "cells": [{"columnId": 456, "value": "new value"}]}]',
      required: true,
    }),

    // Global operation options
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
      description: 'Enable partial success for bulk operations - some rows may succeed even if others fail',
      required: false,
      defaultValue: true,
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
      rows_data,
      access_api_level,
      allow_partial_success,
      override_validation,
    } = context.propsValue;

    // Parse and validate rows data
    let rowsArray;
    try {
      rowsArray = JSON.parse(rows_data as string);
      if (!Array.isArray(rowsArray)) {
        throw new Error('Rows data must be a JSON array');
      }
      if (rowsArray.length === 0) {
        throw new Error('At least one row must be provided');
      }
      if (rowsArray.length > 500) {
        throw new Error('Maximum of 500 rows can be updated in a single operation');
      }
    } catch (error: any) {
      throw new Error(`Invalid rows data JSON: ${error.message}`);
    }

    // Validate and transform each row
    const transformedRows = rowsArray.map((row: any, index: number) => {
      if (!row.id) {
        throw new Error(`Row at index ${index} must have an "id" field`);
      }

      const rowObj: any = {
        id: row.id,
      };

      // Add cells if provided
      if (row.cells && Array.isArray(row.cells)) {
        rowObj.cells = row.cells.map((cell: any) => {
          if (!cell.columnId) {
            throw new Error(`Cell in row ${row.id} must have a columnId`);
          }
          return cell; // Pass through the cell object as-is
        });
      }

      // Add positioning if specified
      if (row.toTop) rowObj.toTop = true;
      if (row.toBottom) rowObj.toBottom = true;
      if (row.above) rowObj.above = true;
      if (row.siblingId) rowObj.siblingId = row.siblingId;
      if (row.parentId) rowObj.parentId = row.parentId;
      if (row.indent) rowObj.indent = row.indent;
      if (row.outdent) rowObj.outdent = row.outdent;

      // Add row properties
      if (row.expanded !== undefined) rowObj.expanded = row.expanded;
      if (row.locked !== undefined) rowObj.locked = row.locked;
      if (row.format) rowObj.format = row.format;

      return rowObj;
    });

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

    try {
      const result = await updateRowInSmartsheet(
        context.auth as string,
        sheet_id as string,
        transformedRows,
        queryParams
      );

      return {
        success: true,
        rows: result,
        message: `Successfully processed ${transformedRows.length} row(s)`,
        total_rows: transformedRows.length,
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

      throw new Error(`Failed to update rows: ${error.message}`);
    }
  },
});
