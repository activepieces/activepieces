import { Field, FieldType, PopulatedRecord } from '@activepieces/shared';

/**
 * Create a mock field for testing
 */
export function createMockField(
  id: string,
  externalId: string,
  name: string,
  type: FieldType = FieldType.TEXT
): Field {
  return {
    id,
    externalId,
    name,
    type,
    options: type === FieldType.STATIC_DROPDOWN ? [] : undefined,
  } as Field;
}

/**
 * Create a mock populated record for testing
 */
export function createMockRecord(
  id: string,
  cells: Array<{ fieldId: string; fieldName: string; value: any }>,
  tableId = 'table-id',
  projectId = 'project-id'
): PopulatedRecord {
  const cellsMap: PopulatedRecord['cells'] = {};

  cells.forEach((cell) => {
    cellsMap[cell.fieldId] = {
      fieldName: cell.fieldName,
      value: cell.value,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
  });

  return {
    id,
    tableId,
    projectId,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    cells: cellsMap,
  };
}

/**
 * Create a mock context for testing actions
 */
export function createMockContext(
  propsValue: Record<string, any>,
  serverConfig?: { apiUrl?: string; token?: string }
) {
  return {
    propsValue,
    server: {
      apiUrl: serverConfig?.apiUrl || 'https://api.example.com/',
      token: serverConfig?.token || 'test-token',
    },
  };
}

/**
 * Create a mock HTTP response
 */
export function createMockHttpResponse<T>(body: T, status = 200) {
  return {
    status,
    body,
    headers: {},
  };
}

/**
 * Create a mock SeekPage response for list operations
 */
export function createMockSeekPage<T>(data: T[], next?: string) {
  return {
    data,
    next,
  };
}
