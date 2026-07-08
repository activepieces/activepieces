import { OutputSchema } from '@activepieces/pieces-framework';

export const findWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'found',
			label: 'Found',
			format: 'boolean',
		},
		{
			key: 'worksheets',
			label: 'Worksheets',
			labelKey: 'title',
			listItems: [
				{
					key: 'sheetId',
					label: 'Sheet ID',
					value: 'properties.sheetId',
				},
				{
					key: 'title',
					label: 'Title',
					value: 'properties.title',
				},
				{
					key: 'index',
					label: 'Index',
					value: 'properties.index',
					format: 'number',
				},
				{
					key: 'sheetType',
					label: 'Sheet Type',
					value: 'properties.sheetType',
				},
				{
					key: 'rowCount',
					label: 'Row Count',
					value: 'properties.gridProperties.rowCount',
					format: 'number',
				},
				{
					key: 'columnCount',
					label: 'Column Count',
					value: 'properties.gridProperties.columnCount',
					format: 'number',
				},
			],
		},
	],
};

export const insertRowActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'spreadsheetId',
			label: 'Spreadsheet ID',
		},
		{
			key: 'tableRange',
			label: 'Table Range',
		},
		{
			key: 'row',
			label: 'Row Number',
			value: 'row',
		},
		{
			key: 'updates',
			label: 'Updates',
			children: [
				{
					key: 'updatedRange',
					label: 'Updated Range',
				},
				{
					key: 'updatedRows',
					label: 'Updated Rows',
					format: 'number',
				},
				{
					key: 'updatedColumns',
					label: 'Updated Columns',
					format: 'number',
				},
				{
					key: 'updatedCells',
					label: 'Updated Cells',
					format: 'number',
				},
			],
		},
	],
};

export const insertRowAtTopActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'row',
			label: 'Row Number',
			format: 'number',
		},
		{
			key: 'updates',
			label: 'Updates',
			children: [
				{
					key: 'spreadsheetId',
					label: 'Spreadsheet ID',
					value: 'spreadsheetId',
				},
				{
					key: 'updatedRange',
					label: 'Updated Range',
					value: 'updatedRange',
				},
				{
					key: 'updatedRows',
					label: 'Updated Rows',
					value: 'updatedRows',
					format: 'number',
				},
				{
					key: 'updatedColumns',
					label: 'Updated Columns',
					value: 'updatedColumns',
					format: 'number',
				},
				{
					key: 'updatedCells',
					label: 'Updated Cells',
					value: 'updatedCells',
					format: 'number',
				},
			],
		},
	],
};

export const googleSheetsInsertMultipleRowsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tableRange',
			label: 'Table Range',
		},
		{
			key: 'spreadsheetId',
			label: 'Spreadsheet ID',
		},
		{
			key: 'updates',
			label: 'Updates',
			children: [
				{
					key: 'updatedRange',
					label: 'Updated Range',
					value: 'updatedRange',
				},
				{
					key: 'updatedRows',
					label: 'Updated Rows',
					value: 'updatedRows',
					format: 'number',
				},
				{
					key: 'updatedColumns',
					label: 'Updated Columns',
					value: 'updatedColumns',
					format: 'number',
				},
				{
					key: 'updatedCells',
					label: 'Updated Cells',
					value: 'updatedCells',
					format: 'number',
				},
				{
					key: 'spreadsheetId',
					label: 'Spreadsheet ID',
					value: 'spreadsheetId',
				},
			],
		},
	],
};

export const updateRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'row',
      label: 'Row Number',
      value: 'row',
    },
    {
      key: 'updatedRange',
      label: 'Updated Range',
      value: 'updates.updatedRange',
    },
    {
      key: 'spreadsheetId',
      label: 'Spreadsheet ID',
      value: 'updates.spreadsheetId',
    },
  ],
};

export const deleteRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
  ],
};

export const deleteMultipleRowsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'success',
			label: 'Success',
			format: 'boolean',
		},
		{
			key: 'deletedRanges',
			label: 'Deleted Ranges',
			labelKey: 'startRow',
			listItems: [
				{
					key: 'startRow',
					label: 'Start Row',
					format: 'number',
				},
				{
					key: 'endRow',
					label: 'End Row',
					format: 'number',
				},
			],
		},
	],
};

export const findRowsActionOutputSchema: OutputSchema = {
	itemLabel: 'Row {row}',
	fields: [
		{
			key: 'rows',
			label: 'Found Rows',
			value: '',
			listItems: [
				{
					key: 'row',
					label: 'Row Number',
					value: 'row',
				},
				{
					key: 'values',
					label: 'Values',
					value: 'values',
					dynamicKey: true,
				},
			],
		},
	],
};

export const findOrCreateRowActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'found',
			label: 'Found',
			format: 'boolean',
		},
		{
			key: 'created',
			label: 'Created',
			format: 'boolean',
		},
		{
			key: 'row',
			label: 'Row Number',
		},
		{
			key: 'values',
			label: 'Values',
			dynamicKey: true,
			children: [
				{
					key: 'A',
					label: 'Column A',
					value: 'A',
				},
				{
					key: 'B',
					label: 'Column B',
					value: 'B',
				},
				{
					key: 'C',
					label: 'Column C',
					value: 'C',
				},
			],
		},
	],
};

export const createSpreadsheetActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'id',
			label: 'Spreadsheet ID',
		},
	],
};

export const createWorksheetActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Worksheet ID',
    },
    {
      key: 'spreadsheetId',
      label: 'Spreadsheet ID',
    },
    {
      key: 'updatedRange',
      label: 'Updated Range',
      value: 'updates.updatedRange',
    },
  ],
};

export const findOrCreateWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'found',
			label: 'Found',
			format: 'boolean',
		},
		{
			key: 'created',
			label: 'Created',
			format: 'boolean',
		},
		{
			key: 'worksheet',
			label: 'Worksheet',
			children: [
				{
					key: 'title',
					label: 'Title',
				},
				{
					key: 'sheetId',
					label: 'Sheet ID',
				},
				{
					key: 'index',
					label: 'Index',
					format: 'number',
				},
				{
					key: 'sheetType',
					label: 'Sheet Type',
				},
				{
					key: 'gridProperties',
					label: 'Grid Properties',
					children: [
						{
							key: 'rowCount',
							label: 'Row Count',
							format: 'number',
						},
						{
							key: 'columnCount',
							label: 'Column Count',
							format: 'number',
						},
					],
				},
			],
		},
	],
};

export const clearSheetActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'spreadsheetId',
			label: 'Spreadsheet ID',
		},
	],
};

export const clearRowsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'success',
			label: 'Success',
			format: 'boolean',
		},
		{
			key: 'clearedRange',
			label: 'Cleared Range',
		},
		{
			key: 'startingRow',
			label: 'Starting Row',
			format: 'number',
		},
		{
			key: 'endingRow',
			label: 'Ending Row',
			format: 'number',
		},
	],
};

export const deleteWorksheetActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'spreadsheetId',
            label: 'Spreadsheet ID',
        },
    ],
};

export const renameWorksheetActionOutputSchema: OutputSchema = {
    fields: [
        {
            key: 'spreadsheetId',
            label: 'Spreadsheet ID',
        },
    ],
};

export const formatRowActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'success',
			label: 'Success',
			format: 'boolean',
		},
		{
			key: 'spreadsheetId',
			label: 'Spreadsheet ID',
		},
	],
};

export const findRowByNumActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'found',
			label: 'Found',
			format: 'boolean',
		},
		{
			key: 'row',
			label: 'Row Number',
		},
		{
			key: 'values',
			label: 'Values',
			dynamicKey: true,
		},
	],
};

export const getManyRowsActionOutputSchema: OutputSchema = {
    itemLabel: 'Row {row}',
    fields: [
        {
            key: 'rows',
            label: 'Rows',
            value: '',
            listItems: [
                {
                    key: 'row',
                    label: 'Row Number',
                    value: 'row',
                },
                {
                    key: 'values',
                    label: 'Values',
                    value: 'values',
                    dynamicKey: true,
                },
            ],
        },
    ],
};

export const readDataRangeActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'range',
			label: 'Resolved Range',
		},
		{
			key: 'majorDimension',
			label: 'Major Dimension',
		},
		{
			key: 'values',
			label: 'Rows',
			description: 'Array of rows, each containing cell values',
		},
	],
};

export const copyWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'title',
			label: 'Title',
		},
		{
			key: 'sheetId',
			label: 'Sheet ID',
		},
		{
			key: 'index',
			label: 'Index',
			format: 'number',
		},
		{
			key: 'sheetType',
			label: 'Sheet Type',
		},
		{
			key: 'gridProperties',
			label: 'Grid Properties',
			children: [
				{
					key: 'rowCount',
					label: 'Row Count',
					format: 'number',
				},
				{
					key: 'columnCount',
					label: 'Column Count',
					format: 'number',
				},
			],
		},
	],
};

export const createColumnActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'updatedRange',
			label: 'Updated Range',
		},
		{
			key: 'spreadsheetId',
			label: 'Spreadsheet ID',
		},
		{
			key: 'updatedColumns',
			label: 'Updated Columns',
			format: 'number',
		},
		{
			key: 'updatedRows',
			label: 'Updated Rows',
			format: 'number',
		},
		{
			key: 'updatedCells',
			label: 'Updated Cells',
			format: 'number',
		},
	],
};

export const exportSheetActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'filename',
      label: 'File Name',
    },
    {
      key: 'format',
      label: 'Format',
    },
    {
      key: 'file',
      label: 'File',
      format: 'url',
    },
  ],
};

export const newSpreadsheetTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'name',
			label: 'Name',
		},
		{
			key: 'id',
			label: 'Spreadsheet ID',
		},
		{
			key: 'webViewLink',
			label: 'Web View Link',
			format: 'url',
		},
		{
			key: 'mimeType',
			label: 'MIME Type',
		},
		{
			key: 'createdTime',
			label: 'Created Time',
			format: 'datetime',
		},
		{
			key: 'modifiedTime',
			label: 'Modified Time',
			format: 'datetime',
		},
		{
			key: 'size',
			label: 'Size',
			format: 'filesize',
		},
		{
			key: 'iconLink',
			label: 'Icon Link',
			format: 'image',
		},
		{
			key: 'thumbnailLink',
			label: 'Thumbnail Link',
			format: 'image',
		},
		{
			key: 'shared',
			label: 'Shared',
			format: 'boolean',
		},
		{
			key: 'starred',
			label: 'Starred',
			format: 'boolean',
		},
		{
			key: 'trashed',
			label: 'Trashed',
			format: 'boolean',
		},
		{
			key: 'ownedByMe',
			label: 'Owned By Me',
			format: 'boolean',
		},
		{
			key: 'parents',
			label: 'Parent Folder IDs',
		},
		{
			key: 'lastModifyingUser',
			label: 'Last Modifying User',
			children: [
				{
					key: 'displayName',
					label: 'Display Name',
				},
				{
					key: 'emailAddress',
					label: 'Email',
					format: 'email',
				},
				{
					key: 'photoLink',
					label: 'Photo',
					format: 'image',
				},
			],
		},
		{
			key: 'owners',
			label: 'Owners',
			labelKey: 'displayName',
			listItems: [
				{
					key: 'displayName',
					label: 'Display Name',
				},
				{
					key: 'emailAddress',
					label: 'Email',
					format: 'email',
				},
				{
					key: 'photoLink',
					label: 'Photo',
					format: 'image',
				},
			],
		},
		{
			key: 'permissions',
			label: 'Permissions',
			labelKey: 'displayName',
			listItems: [
				{
					key: 'displayName',
					label: 'Display Name',
				},
				{
					key: 'emailAddress',
					label: 'Email',
					format: 'email',
				},
				{
					key: 'role',
					label: 'Role',
				},
				{
					key: 'type',
					label: 'Type',
				},
				{
					key: 'id',
					label: 'Permission ID',
				},
			],
		},
	],
};

export const findSpreadsheetsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'found',
			label: 'Found',
			format: 'boolean',
		},
		{
			key: 'spreadsheets',
			label: 'Spreadsheets',
			labelKey: 'name',
			listItems: [
				{
					key: 'name',
					label: 'Name',
				},
				{
					key: 'id',
					label: 'Spreadsheet ID',
				},
				{
					key: 'webViewLink',
					label: 'Web View Link',
					format: 'url',
				},
				{
					key: 'createdTime',
					label: 'Created Time',
					format: 'datetime',
				},
				{
					key: 'modifiedTime',
					label: 'Modified Time',
					format: 'datetime',
				},
			],
		},
	],
};

export const getNextRowsActionOutputSchema: OutputSchema = {
  itemLabel: 'Row {row}',
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      value: '',
      listItems: [
        {
          key: 'row',
          label: 'Row Number',
          value: 'row',
        },
        {
          key: 'values',
          label: 'Values',
          value: 'values',
          dynamicKey: true,
        },
      ],
    },
  ],
};

export const updateMultipleRowsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'totalUpdatedRows',
      label: 'Total Updated Rows',
      value: 'totalUpdatedRows',
      format: 'number',
    },
    {
      key: 'totalUpdatedColumns',
      label: 'Total Updated Columns',
      value: 'totalUpdatedColumns',
      format: 'number',
    },
    {
      key: 'totalUpdatedCells',
      label: 'Total Updated Cells',
      value: 'totalUpdatedCells',
      format: 'number',
    },
    {
      key: 'totalUpdatedSheets',
      label: 'Total Updated Sheets',
      value: 'totalUpdatedSheets',
      format: 'number',
    },
    {
      key: 'spreadsheetId',
      label: 'Spreadsheet ID',
      value: 'spreadsheetId',
    },
    {
      key: 'responses',
      label: 'Responses',
      value: 'responses',
      labelKey: 'updatedRange',
      listItems: [
        {
          key: 'updatedRange',
          label: 'Updated Range',
          value: 'updatedRange',
        },
        {
          key: 'updatedRows',
          label: 'Updated Rows',
          value: 'updatedRows',
          format: 'number',
        },
        {
          key: 'updatedColumns',
          label: 'Updated Columns',
          value: 'updatedColumns',
          format: 'number',
        },
        {
          key: 'updatedCells',
          label: 'Updated Cells',
          value: 'updatedCells',
          format: 'number',
        },
        {
          key: 'spreadsheetId',
          label: 'Spreadsheet ID',
          value: 'spreadsheetId',
        },
      ],
    },
  ],
};

export const newWorksheetTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'title',
			label: 'Title',
			value: 'properties.title',
		},
		{
			key: 'sheetId',
			label: 'Sheet ID',
			value: 'properties.sheetId',
		},
		{
			key: 'index',
			label: 'Index',
			value: 'properties.index',
			format: 'number',
		},
		{
			key: 'sheetType',
			label: 'Sheet Type',
			value: 'properties.sheetType',
		},
		{
			key: 'gridProperties',
			label: 'Grid Properties',
			value: 'properties.gridProperties',
			children: [
				{
					key: 'rowCount',
					label: 'Row Count',
					value: 'rowCount',
					format: 'number',
				},
				{
					key: 'columnCount',
					label: 'Column Count',
					value: 'columnCount',
					format: 'number',
				},
			],
		},
	],
};

export const googlesheetsNewRowAddedTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'row',
			label: 'Row Number',
			value: 'row',
		},
		{
			key: 'values',
			label: 'Values',
			value: 'values',
			dynamicKey: true,
		},
	],
};

export const googleSheetsNewOrUpdatedRowTriggerOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'row',
			label: 'Row Number',
			value: 'row',
		},
		{
			key: 'values',
			label: 'Values',
			value: 'values',
			dynamicKey: true,
		},
	],
};
