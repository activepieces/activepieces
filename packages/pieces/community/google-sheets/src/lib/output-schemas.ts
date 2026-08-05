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

const valuesUpdateFields: OutputSchema['fields'] = [
	{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' },
	{ key: 'updatedRange', label: 'Updated Range', value: 'updatedRange' },
	{ key: 'updatedRows', label: 'Updated Rows', value: 'updatedRows', format: 'number' },
	{ key: 'updatedColumns', label: 'Updated Columns', value: 'updatedColumns', format: 'number' },
	{ key: 'updatedCells', label: 'Updated Cells', value: 'updatedCells', format: 'number' },
];

const valuesAppendFields: OutputSchema['fields'] = [
	{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' },
	{ key: 'tableRange', label: 'Table Range', value: 'tableRange' },
	{ key: 'updates', label: 'Updates', value: 'updates', children: valuesUpdateFields },
];

export const sheetsAddColumnActionOutputSchema: OutputSchema = {
	fields: valuesUpdateFields,
};

export const sheetsAddMultipleRowsActionOutputSchema: OutputSchema = {
	fields: valuesAppendFields,
};

export const sheetsAddRowAtTopActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'row', label: 'Row Number', value: 'row', format: 'number' },
		{ key: 'updates', label: 'Updates', value: 'updates', children: valuesUpdateFields },
	],
};

export const sheetsAddRowActionOutputSchema: OutputSchema = {
	fields: [
		...valuesAppendFields,
		{ key: 'row', label: 'Row Number', value: 'row', format: 'number' },
	],
};

export const sheetsAddWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Worksheet ID', value: 'id', format: 'number' },
		{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' },
		{ key: 'updates', label: 'Updates', value: 'updates', children: valuesUpdateFields },
	],
};

const batchUpdateSuccessFields: OutputSchema['fields'] = [
	{ key: 'success', label: 'Success', value: 'success', format: 'boolean' },
	{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' },
];

export const sheetsAppendDimensionActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsAutoResizeDimensionsActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsAppendValuesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'updatedRange', label: 'Updated Range', value: 'updatedRange' },
		{ key: 'updatedRows', label: 'Updated Rows', value: 'updatedRows', format: 'number' },
		{ key: 'updatedColumns', label: 'Updated Columns', value: 'updatedColumns', format: 'number' },
		{ key: 'updatedCells', label: 'Updated Cells', value: 'updatedCells', format: 'number' },
	],
};

export const sheetsClearValuesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', value: 'success', format: 'boolean' },
		{ key: 'startingRow', label: 'Starting Row', value: 'startingRow', format: 'number' },
		{ key: 'endingRow', label: 'Ending Row', value: 'endingRow', format: 'number' },
		{ key: 'clearedRange', label: 'Cleared Range', value: 'clearedRange' },
	],
};

const sheetPropertiesFields: OutputSchema['fields'] = [
	{ key: 'sheetId', label: 'Worksheet ID', value: 'sheetId', format: 'number' },
	{ key: 'title', label: 'Title', value: 'title' },
	{ key: 'index', label: 'Index', value: 'index', format: 'number' },
	{ key: 'sheetType', label: 'Sheet Type', value: 'sheetType' },
	{
		key: 'gridProperties',
		label: 'Grid Properties',
		value: 'gridProperties',
		children: [
			{ key: 'rowCount', label: 'Row Count', value: 'rowCount', format: 'number' },
			{ key: 'columnCount', label: 'Column Count', value: 'columnCount', format: 'number' },
		],
	},
];

const rowValuesFields: OutputSchema['fields'] = [
	{ key: 'row', label: 'Row Number', value: 'row', format: 'number' },
	{ key: 'values', label: 'Values', value: 'values', dynamicKey: true },
];

export const sheetsCopyWorksheetActionOutputSchema: OutputSchema = {
	fields: sheetPropertiesFields,
};

export const sheetsCreateSpreadsheetActionOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Spreadsheet ID', value: 'id' }],
};

export const sheetsDeleteDimensionActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsDeleteMultipleRowsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', value: 'success', format: 'boolean' },
		{
			key: 'deletedRanges',
			label: 'Deleted Ranges',
			value: 'deletedRanges',
			labelKey: 'startRow',
			listItems: [
				{ key: 'startRow', label: 'Start Row', value: 'startRow', format: 'number' },
				{ key: 'endRow', label: 'End Row', value: 'endRow', format: 'number' },
			],
		},
	],
};

export const sheetsDeleteRowActionOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', value: 'success', format: 'boolean' }],
};

export const sheetsDeleteWorksheetActionOutputSchema: OutputSchema = {
	fields: [{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' }],
};

export const sheetsExportWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'format', label: 'Format', value: 'format' },
		{ key: 'filename', label: 'File Name', value: 'filename' },
		{ key: 'file', label: 'File', value: 'file', format: 'url' },
		{ key: 'text', label: 'Text', value: 'text' },
	],
};

export const sheetsFindOrCreateRowActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', value: 'found', format: 'boolean' },
		{ key: 'created', label: 'Created', value: 'created', format: 'boolean' },
		...rowValuesFields,
	],
};

export const sheetsFindOrCreateWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', value: 'found', format: 'boolean' },
		{ key: 'created', label: 'Created', value: 'created', format: 'boolean' },
		{ key: 'worksheet', label: 'Worksheet', value: 'worksheet', children: sheetPropertiesFields },
	],
};

export const sheetsFindRowsActionOutputSchema: OutputSchema = {
	itemLabel: 'Row {row}',
	fields: [
		{
			key: 'rows',
			label: 'Found Rows',
			value: '',
			listItems: rowValuesFields,
		},
	],
};

export const sheetsFindWorksheetActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', value: 'found', format: 'boolean' },
		{
			key: 'worksheets',
			label: 'Worksheets',
			value: 'worksheets',
			labelKey: 'title',
			listItems: sheetPropertiesFields,
		},
	],
};

export const sheetsFormatCellsActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsGetAllRowsActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'rows',
			label: 'Rows',
			value: 'rows',
			labelKey: 'row',
			listItems: rowValuesFields,
		},
		{ key: 'count', label: 'Count', value: 'count', format: 'number' },
	],
};

export const sheetsGetNextRowsActionOutputSchema: OutputSchema = {
	itemLabel: 'Row {row}',
	fields: [
		{
			key: 'rows',
			label: 'Rows',
			value: '',
			listItems: rowValuesFields,
		},
	],
};

export const sheetsGetRowActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', value: 'found', format: 'boolean' },
		...rowValuesFields,
	],
};

const spreadsheetWorksheetSummaryFields: OutputSchema['fields'] = [
	{ key: 'sheet_id', label: 'Worksheet ID', value: 'sheet_id', format: 'number' },
	{ key: 'title', label: 'Title', value: 'title' },
	{ key: 'index', label: 'Index', value: 'index', format: 'number' },
	{ key: 'sheet_type', label: 'Sheet Type', value: 'sheet_type' },
	{ key: 'row_count', label: 'Row Count', value: 'row_count', format: 'number' },
	{ key: 'column_count', label: 'Column Count', value: 'column_count', format: 'number' },
];

export const sheetsGetSpreadsheetActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'spreadsheet_id', label: 'Spreadsheet ID', value: 'spreadsheet_id' },
		{ key: 'title', label: 'Title', value: 'title' },
		{ key: 'locale', label: 'Locale', value: 'locale' },
		{ key: 'time_zone', label: 'Time Zone', value: 'time_zone' },
		{ key: 'url', label: 'Spreadsheet URL', value: 'url', format: 'url' },
		{
			key: 'worksheets',
			label: 'Worksheets',
			value: 'worksheets',
			labelKey: 'title',
			listItems: spreadsheetWorksheetSummaryFields,
		},
		{ key: 'worksheet_count', label: 'Worksheet Count', value: 'worksheet_count', format: 'number' },
	],
};

export const sheetsGetValuesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'range', label: 'Range', value: 'range' },
		{ key: 'majorDimension', label: 'Major Dimension', value: 'majorDimension' },
		{ key: 'values', label: 'Values', value: 'values' },
	],
};

export const sheetsInsertDimensionActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsRenameWorksheetActionOutputSchema: OutputSchema = {
	fields: [{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' }],
};

export const sheetsSearchSpreadsheetsActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', value: 'found', format: 'boolean' },
		{
			key: 'spreadsheets',
			label: 'Spreadsheets',
			value: 'spreadsheets',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Spreadsheet ID', value: 'id' },
				{ key: 'name', label: 'Name', value: 'name' },
				{ key: 'webViewLink', label: 'Web View Link', value: 'webViewLink', format: 'url' },
				{ key: 'createdTime', label: 'Created Time', value: 'createdTime', format: 'datetime' },
				{ key: 'modifiedTime', label: 'Modified Time', value: 'modifiedTime', format: 'datetime' },
			],
		},
	],
};

export const sheetsUpdateDimensionPropertiesActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

const batchUpdateValuesFields: OutputSchema['fields'] = [
	{ key: 'spreadsheetId', label: 'Spreadsheet ID', value: 'spreadsheetId' },
	{ key: 'totalUpdatedRows', label: 'Total Updated Rows', value: 'totalUpdatedRows', format: 'number' },
	{
		key: 'totalUpdatedColumns',
		label: 'Total Updated Columns',
		value: 'totalUpdatedColumns',
		format: 'number',
	},
	{ key: 'totalUpdatedCells', label: 'Total Updated Cells', value: 'totalUpdatedCells', format: 'number' },
	{
		key: 'totalUpdatedSheets',
		label: 'Total Updated Sheets',
		value: 'totalUpdatedSheets',
		format: 'number',
	},
];

export const sheetsUpdateMultipleRowsActionOutputSchema: OutputSchema = {
	fields: batchUpdateValuesFields,
};

export const sheetsUpdateRowActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'updates', label: 'Updates', value: 'updates', children: valuesUpdateFields },
		{ key: 'row', label: 'Row Number', value: 'row', format: 'number' },
	],
};

export const sheetsUpdateSheetPropertiesActionOutputSchema: OutputSchema = {
	fields: batchUpdateSuccessFields,
};

export const sheetsUpdateValuesActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'updatedRange', label: 'Updated Range', value: 'updatedRange' },
		{ key: 'updatedRows', label: 'Updated Rows', value: 'updatedRows', format: 'number' },
		{ key: 'updatedColumns', label: 'Updated Columns', value: 'updatedColumns', format: 'number' },
		{ key: 'updatedCells', label: 'Updated Cells', value: 'updatedCells', format: 'number' },
	],
};
