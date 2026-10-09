import { OutputSchema } from '@activepieces/pieces-framework';

const rowFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'Row ID',
    description: 'Use this to read or update the row in a later step.',
  },
  {
    key: 'name',
    label: 'Name',
    description: 'Value of the table\'s display column for this row.',
  },
  {
    key: 'values',
    label: 'Column Values',
    dynamicKey: true,
    labelKey: 'name',
    description:
      'The row\'s cells, keyed by your column names. The keys depend on the table, so they differ from doc to doc.',
  },
  {
    key: 'index',
    label: 'Row Index',
    format: 'number',
    description: 'Zero-based position of the row in the table.',
  },
  {
    key: 'createdAt',
    label: 'Created At',
    format: 'datetime',
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
    format: 'datetime',
  },
  {
    key: 'browserLink',
    label: 'Browser Link',
    format: 'url',
    description: 'Opens the row in Coda.',
  },
];


const requestIdField: OutputSchema['fields'][number] = {
  key: 'requestId',
  label: 'Request ID',
  description: 'Coda applies the change in the background. Pass this to Get Mutation Status to check it was applied.',
};

const mutationFields: OutputSchema['fields'] = [
  requestIdField,
  {
    key: 'completed',
    label: 'Completed',
    format: 'boolean',
    description: 'True once Coda has applied the change. False when waiting was off or took longer than 30 seconds; check later with Get Mutation Status.',
  },
  {
    key: 'warning',
    label: 'Warning',
    description: 'A warning from Coda about the applied change, or why its status could not be checked.',
  },
];

const refFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const docFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Doc ID' },
  { key: 'name', label: 'Name' },
  { key: 'browserLink', label: 'Browser Link', format: 'url' },
  { key: 'owner', label: 'Owner Email', format: 'email' },
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'workspace', label: 'Workspace', children: refFields },
  { key: 'folder', label: 'Folder', children: refFields },
];

const docSizeField: OutputSchema['fields'][number] = {
  key: 'docSize',
  label: 'Doc Size',
  children: [
    { key: 'totalRowCount', label: 'Total Rows', format: 'number' },
    { key: 'tableAndViewCount', label: 'Tables and Views', format: 'number' },
    { key: 'pageCount', label: 'Pages', format: 'number' },
    {
      key: 'overApiSizeLimit',
      label: 'Over API Size Limit',
      format: 'boolean',
      description: 'When true the doc is too large for the API to read.',
    },
  ],
};

const personFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

const pageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  { key: 'name', label: 'Name' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'browserLink', label: 'Browser Link', format: 'url' },
  { key: 'contentType', label: 'Content Type', description: '"canvas" for a normal page, "embed" or "syncPage" for special pages.' },
  { key: 'isHidden', label: 'Hidden', format: 'boolean' },
  { key: 'parent', label: 'Parent Page', children: refFields },
  { key: 'children', label: 'Subpages', labelKey: 'name', listItems: refFields },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: personFields },
  { key: 'updatedBy', label: 'Updated By', children: personFields },
];

const columnFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Column ID' },
  { key: 'name', label: 'Name' },
  { key: 'display', label: 'Display Column', format: 'boolean', description: 'True for the column whose value names each row.' },
  { key: 'calculated', label: 'Calculated', format: 'boolean', description: 'True for formula or button columns, which cannot be written.' },
  { key: 'formula', label: 'Formula' },
  {
    key: 'format',
    label: 'Format',
    children: [
      { key: 'type', label: 'Type', description: 'For example text, number, date, dateTime, checkbox, select, email, person, button.' },
      { key: 'isArray', label: 'Holds a List', format: 'boolean' },
    ],
  },
];

const pageRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  { key: 'name', label: 'Name' },
  { key: 'browserLink', label: 'Browser Link', format: 'url' },
];

const formulaRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Formula ID' },
  { key: 'name', label: 'Name' },
  { key: 'parent', label: 'Page', children: pageRefFields },
];

const controlRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Control ID' },
  { key: 'name', label: 'Name' },
  { key: 'parent', label: 'Page', children: pageRefFields },
];

const folderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'browserLink', label: 'Browser Link', format: 'url' },
  { key: 'canEdit', label: 'Can Edit', format: 'boolean' },
  { key: 'workspace', label: 'Workspace', children: refFields },
];

const permissionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Permission ID' },
  { key: 'access', label: 'Access', description: 'readonly, comment, write or none.' },
  {
    key: 'principal',
    label: 'Shared With',
    children: [
      { key: 'type', label: 'Type', description: 'email, domain, workspace or anyone.' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'domain', label: 'Domain' },
    ],
  },
];

function pagedSchema({ label, labelKey, itemFields }: { label: string; labelKey: string; itemFields: OutputSchema['fields'] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      {
        key: 'nextPageToken',
        label: 'Next Page Token',
        description: 'Pass this as Page Token to get the next page. Empty on the last page.',
      },
      { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when another page of results exists.' },
    ],
  };
}

const tableFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Table ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'tableType',
    label: 'Table Type',
    description: 'Either "table" or "view".',
  },
  {
    key: 'browserLink',
    label: 'Browser Link',
    format: 'url',
    description: 'Opens the table in Coda.',
  },
  {
    key: 'parent',
    label: 'Page',
    description: 'The doc page the table sits on.',
    children: [
      { key: 'id', label: 'Page ID' },
      { key: 'name', label: 'Name' },
      { key: 'browserLink', label: 'Browser Link', format: 'url' },
    ],
  },
];

export const createRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rowId',
      label: 'Row ID',
      description:
        'Coda applies row writes asynchronously, so the new row may not be readable for a few seconds. Add a short delay before passing this to Get Row.',
    },
    requestIdField,
  ],
};

export const updateRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rowId',
      label: 'Row ID',
      description: 'The row that was updated.',
    },
    requestIdField,
  ],
};

export const getRowActionOutputSchema: OutputSchema = {
  fields: [
    ...rowFields,
    {
      key: 'parent',
      label: 'Table',
      children: [
        { key: 'id', label: 'Table ID' },
        { key: 'name', label: 'Name' },
        { key: 'tableType', label: 'Table Type' },
        { key: 'browserLink', label: 'Browser Link', format: 'url' },
      ],
    },
  ],
};

export const findRowActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when no row matched, in which case Rows is empty.',
    },
    {
      key: 'result',
      label: 'Rows',
      labelKey: 'name',
      description: 'Every matching row, across all pages of results.',
      listItems: rowFields,
    },
  ],
};

export const listTablesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      format: 'boolean',
      description: 'False when the doc has no tables, in which case Tables is empty.',
    },
    {
      key: 'result',
      label: 'Tables',
      labelKey: 'name',
      listItems: tableFields,
    },
  ],
};

export const getTableActionOutputSchema: OutputSchema = {
  fields: [
    ...tableFields,
    {
      key: 'rowCount',
      label: 'Row Count',
      format: 'number',
    },
    {
      key: 'displayColumn',
      label: 'Display Column',
      description: 'The column whose value names each row. Coda returns its id only, not its name.',
      children: [{ key: 'id', label: 'Column ID' }],
    },
    {
      key: 'layout',
      label: 'Layout',
      description: 'How the table is laid out in the doc, for example "default".',
    },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  ],
};

export const newRowCreatedTriggerOutputSchema: OutputSchema = { fields: rowFields };

export const upsertRowActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      ...requestIdField,
      description: 'Coda applies upserts asynchronously. Pass this to Get Mutation Status to check it was applied.',
    },
  ],
};

export const getCurrentUserActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'loginId', label: 'Login Email', format: 'email' },
    { key: 'tokenName', label: 'Token Name' },
    { key: 'scoped', label: 'Token Is Restricted', format: 'boolean', description: 'True when the API token only works for some docs.' },
    { key: 'pictureLink', label: 'Picture', format: 'image' },
    { key: 'workspace', label: 'Workspace', children: refFields },
  ],
};

export const listDocsActionOutputSchema = pagedSchema({ label: 'Docs', labelKey: 'name', itemFields: docFields });

export const getDocActionOutputSchema: OutputSchema = { fields: [...docFields, docSizeField] };

export const createDocActionOutputSchema: OutputSchema = {
  fields: [
    ...docFields,
    { key: 'sourceDoc', label: 'Copied From', children: [{ key: 'id', label: 'Doc ID' }] },
    ...mutationFields,
  ],
};

export const updateDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Doc ID' },
    { key: 'title', label: 'New Title' },
    { key: 'iconName', label: 'New Icon Name' },
  ],
};

export const deleteDocActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Doc ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when the doc was not found, usually because it was deleted before.' },
  ],
};

export const listFoldersActionOutputSchema = pagedSchema({ label: 'Folders', labelKey: 'name', itemFields: folderFields });

export const listPagesActionOutputSchema = pagedSchema({ label: 'Pages', labelKey: 'name', itemFields: pageFields });

export const getPageActionOutputSchema: OutputSchema = { fields: pageFields };

export const pageMutationActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Page ID' }, ...mutationFields],
};

export const deletePageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Page ID' },
    { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when the page was not found, usually because it was deleted before.' },
    ...mutationFields,
  ],
};

export const getPageContentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content', description: 'The page as Markdown or HTML. Empty when Completed is false.' },
    { key: 'format', label: 'Format' },
    { key: 'completed', label: 'Completed', format: 'boolean', description: 'False when Coda needed more than a minute; run again with the Export ID.' },
    { key: 'exportId', label: 'Export ID' },
    { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the page was larger than 5 MB and was cut off.' },
    { key: 'pageId', label: 'Page' },
  ],
};

export const listDocTablesActionOutputSchema = pagedSchema({ label: 'Tables', labelKey: 'name', itemFields: tableFields });

export const listColumnsActionOutputSchema = pagedSchema({ label: 'Columns', labelKey: 'name', itemFields: columnFields });

export const listRowsActionOutputSchema = pagedSchema({ label: 'Rows', labelKey: 'name', itemFields: rowFields });

export const createRowsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'addedRowIds', label: 'Added Row IDs', description: 'IDs of the new rows, in the order given.' },
    ...mutationFields,
  ],
};

export const upsertRowsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'rowCount', label: 'Rows Sent', format: 'number' },
    ...mutationFields,
  ],
};

export const updateRowByIdActionOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Row ID' }, ...mutationFields],
};

export const deleteRowsActionOutputSchema: OutputSchema = {
  fields: [{ key: 'rowIds', label: 'Deleted Row IDs' }, ...mutationFields],
};

export const pushButtonActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'rowId', label: 'Row ID' },
    { key: 'columnId', label: 'Button Column ID' },
    ...mutationFields,
  ],
};

export const listFormulasActionOutputSchema = pagedSchema({ label: 'Formulas', labelKey: 'name', itemFields: formulaRefFields });

export const getFormulaActionOutputSchema: OutputSchema = {
  fields: [
    ...formulaRefFields,
    { key: 'value', label: 'Value', description: 'The formula result: text, number, boolean, date or a list.' },
  ],
};

export const listControlsActionOutputSchema = pagedSchema({ label: 'Controls', labelKey: 'name', itemFields: controlRefFields });

export const getControlActionOutputSchema: OutputSchema = {
  fields: [
    ...controlRefFields,
    { key: 'controlType', label: 'Control Type', description: 'For example slider, select, datePicker, checkbox, button.' },
    { key: 'value', label: 'Value' },
  ],
};

export const getMutationStatusActionOutputSchema: OutputSchema = { fields: mutationFields };

export const resolveBrowserLinkActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceType', label: 'Object Type', description: 'doc, page, table, row, column, formula or control.' },
    { key: 'id', label: 'Object ID' },
    { key: 'name', label: 'Name' },
    { key: 'docId', label: 'Doc ID' },
    { key: 'tableId', label: 'Table ID', description: 'Set when the link points to a table, row or column.' },
    { key: 'browserLink', label: 'Browser Link', format: 'url' },
  ],
};

export const listPermissionsActionOutputSchema = pagedSchema({ label: 'Sharing', labelKey: 'id', itemFields: permissionFields });

export const addPermissionActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'docId', label: 'Doc ID' },
    { key: 'permissionId', label: 'Permission ID', description: 'Pass this to Remove Doc Sharing to undo the share.' },
    { key: 'principalType', label: 'Shared With Type' },
    { key: 'principal', label: 'Shared With' },
    { key: 'access', label: 'Access' },
  ],
};

export const removePermissionActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'docId', label: 'Doc ID' },
    { key: 'permissionId', label: 'Permission ID' },
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'alreadyRemoved', label: 'Already Removed', format: 'boolean', description: 'True when the entry was not found, usually because it was removed before.' },
  ],
};

export const triggerAutomationActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ruleId', label: 'Rule ID' },
    { key: 'requestId', label: 'Request ID' },
  ],
};
