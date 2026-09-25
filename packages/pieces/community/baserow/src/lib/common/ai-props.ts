import { Property } from '@activepieces/pieces-framework';

export const baserowAiProps = {
  tableIdProp,
  rowIdProp,
  fieldIdProp,
  workspaceIdProp,
};

function tableIdProp() {
  return Property.Number({
    displayName: 'Table ID',
    description: 'The numeric Baserow table ID. Resolve it with List Tables.',
    required: true,
  });
}

function rowIdProp() {
  return Property.Number({
    displayName: 'Row ID',
    description: 'The numeric row ID. Resolve it with Find Row or List Rows.',
    required: true,
  });
}

function fieldIdProp() {
  return Property.Number({
    displayName: 'Field ID',
    description: 'The numeric field ID. Resolve it with Get Table Fields.',
    required: true,
  });
}

function workspaceIdProp() {
  return Property.Number({
    displayName: 'Workspace ID',
    description: 'The numeric workspace ID. Resolve it with List Workspaces.',
    required: true,
  });
}
