import { HttpMethod } from '@activepieces/pieces-common';
import { kickcallClient, KickcallAuth } from './client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectionDataRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  const data = payload['data'];
  if (Array.isArray(data)) {
    return data;
  }
  return [];
}

function worksheetBasePath({
  locationId,
  agentId,
}: {
  locationId: string;
  agentId: string;
}): string {
  return `/api/v1/business/locations/${encodeURIComponent(locationId)}/agents/${encodeURIComponent(agentId)}/worksheets`;
}

function isWorksheetColumnRow(
  row: unknown,
): row is {
  id: unknown;
  name: unknown;
  data_type?: unknown;
  hidden?: unknown;
  required?: unknown;
} {
  if (!isRecord(row)) {
    return false;
  }
  return 'id' in row && 'name' in row;
}

function isWorksheetRowRow(
  row: unknown,
): row is {
  id: unknown;
  position?: unknown;
  cells?: unknown;
} {
  if (!isRecord(row)) {
    return false;
  }
  return 'id' in row;
}

function isWorksheetCellRow(
  cell: unknown,
): cell is {
  column_id: unknown;
  value?: unknown;
} {
  if (!isRecord(cell)) {
    return false;
  }
  return 'column_id' in cell;
}

function mapWorksheetRow({
  row,
  columns,
}: {
  row: unknown;
  columns: WorksheetColumn[];
}): WorksheetRow | undefined {
  if (!isWorksheetRowRow(row)) {
    return undefined;
  }
  const columnNameById = new Map(
    columns.map((column) => [column.id, column.name]),
  );
  const values: Record<string, string> = {};
  const cells = Array.isArray(row.cells) ? row.cells : [];
  for (const cell of cells) {
    if (!isWorksheetCellRow(cell)) {
      continue;
    }
    const columnName = columnNameById.get(String(cell.column_id));
    if (columnName === undefined) {
      continue;
    }
    values[columnName] =
      cell.value === null || cell.value === undefined
        ? ''
        : String(cell.value);
  }
  return {
    id: String(row.id),
    position:
      row.position === null || row.position === undefined
        ? null
        : Number(row.position),
    values,
  };
}

async function listWorksheets({
  auth,
  locationId,
  agentId,
}: WorksheetScopeParams): Promise<NamedResource[]> {
  const payload = await kickcallClient.bearerRequestAllPages({
    auth,
    path: worksheetBasePath({ locationId, agentId }),
  });
  return kickcallClient.namedOptionsFromCollection(payload).map((option) => ({
    id: option.value,
    name: option.label,
  }));
}

async function listWorksheetColumns({
  auth,
  locationId,
  agentId,
  worksheetId,
}: WorksheetIdParams): Promise<WorksheetColumn[]> {
  const payload = await kickcallClient.bearerRequestAllPages({
    auth,
    path: `${worksheetBasePath({ locationId, agentId })}/${encodeURIComponent(worksheetId)}/columns`,
  });
  return collectionDataRows(payload).flatMap((row) => {
    if (!isWorksheetColumnRow(row)) {
      return [];
    }
    return [
      {
        id: String(row.id),
        name: String(row.name),
        dataType: String(row.data_type ?? 'text'),
        hidden: row.hidden === true,
        required: row.required === true,
      },
    ];
  });
}

async function listWorksheetRows({
  auth,
  locationId,
  agentId,
  worksheetId,
}: WorksheetIdParams): Promise<WorksheetRow[]> {
  const [columns, payload] = await Promise.all([
    listWorksheetColumns({
      auth,
      locationId,
      agentId,
      worksheetId,
    }),
    kickcallClient.bearerRequestAllPages({
      auth,
      path: `${worksheetBasePath({ locationId, agentId })}/${encodeURIComponent(worksheetId)}/rows`,
      queryParams: {
        include: 'cells',
        per_page: '100',
      },
    }),
  ]);
  return collectionDataRows(payload).flatMap((row) => {
    const mapped = mapWorksheetRow({ row, columns });
    if (mapped === undefined) {
      return [];
    }
    return [mapped];
  });
}

async function findWorksheetRows({
  auth,
  locationId,
  agentId,
  worksheetId,
  columnId,
  searchValue,
  matchType,
  limit,
}: FindWorksheetRowsParams): Promise<WorksheetRow[]> {
  const safeLimit = Math.max(1, Math.floor(limit));
  const pageSize = Math.min(100, safeLimit);
  const columns = await listWorksheetColumns({
    auth,
    locationId,
    agentId,
    worksheetId,
  });
  const rows: WorksheetRow[] = [];
  let page = 1;
  const maxPages = 100;
  while (rows.length < safeLimit && page <= maxPages) {
    const queryParams: Record<string, string> = {
      include: 'cells',
      per_page: String(pageSize),
      page: String(page),
    };
    if (searchValue !== undefined && searchValue !== null && searchValue !== '') {
      queryParams['filter[0][column_id]'] = columnId;
      queryParams['filter[0][operation]'] = matchType;
      queryParams['filter[0][value]'] = searchValue;
    }
    const payload = await kickcallClient.bearerRequest({
      auth,
      method: HttpMethod.GET,
      path: `${worksheetBasePath({ locationId, agentId })}/${encodeURIComponent(worksheetId)}/rows`,
      queryParams,
    });
    const pageRows = collectionDataRows(payload).flatMap((row) => {
      const mapped = mapWorksheetRow({ row, columns });
      if (mapped === undefined) {
        return [];
      }
      return [mapped];
    });
    if (pageRows.length === 0) {
      break;
    }
    rows.push(...pageRows);
    if (pageRows.length < pageSize) {
      break;
    }
    page += 1;
  }
  return rows.slice(0, safeLimit);
}

async function addWorksheetRow({
  auth,
  locationId,
  agentId,
  worksheetId,
  values,
}: AddWorksheetRowParams): Promise<WorksheetRow> {
  const basePath = `${worksheetBasePath({ locationId, agentId })}/${encodeURIComponent(worksheetId)}`;
  const [columns, created] = await Promise.all([
    listWorksheetColumns({
      auth,
      locationId,
      agentId,
      worksheetId,
    }),
    kickcallClient.bearerRequest<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: `${basePath}/rows`,
      queryParams: {
        include: 'cells',
      },
      body: {
        row: {
          values,
        },
      },
    }),
  ]);
  const createdRow = mapWorksheetRow({ row: created, columns });
  if (createdRow === undefined) {
    throw new Error('Kickcall row create did not return a valid row');
  }
  return createdRow;
}

async function updateWorksheetRow({
  auth,
  locationId,
  agentId,
  worksheetId,
  rowId,
  values,
}: UpdateWorksheetRowParams): Promise<WorksheetRow> {
  const basePath = `${worksheetBasePath({ locationId, agentId })}/${encodeURIComponent(worksheetId)}`;
  const [columns, updated] = await Promise.all([
    listWorksheetColumns({
      auth,
      locationId,
      agentId,
      worksheetId,
    }),
    kickcallClient.bearerRequest<Record<string, unknown>>({
      auth,
      method: HttpMethod.PUT,
      path: `${basePath}/rows/${encodeURIComponent(rowId)}`,
      queryParams: {
        include: 'cells',
      },
      body: {
        row: {
          values,
        },
      },
    }),
  ]);
  const updatedRow = mapWorksheetRow({ row: updated, columns });
  if (updatedRow === undefined) {
    throw new Error('Kickcall row update did not return a valid row');
  }
  return updatedRow;
}

export const kickcallWorksheets = {
  listWorksheets,
  listWorksheetColumns,
  listWorksheetRows,
  findWorksheetRows,
  addWorksheetRow,
  updateWorksheetRow,
};

type WorksheetScopeParams = {
  auth: KickcallAuth;
  locationId: string;
  agentId: string;
};

type WorksheetIdParams = WorksheetScopeParams & {
  worksheetId: string;
};

type AddWorksheetRowParams = WorksheetIdParams & {
  values: Record<string, string>;
};

type FindWorksheetRowsParams = WorksheetIdParams & {
  columnId: string;
  searchValue: string | undefined;
  matchType: WorksheetRowMatchType;
  limit: number;
};

type UpdateWorksheetRowParams = WorksheetIdParams & {
  rowId: string;
  values: Record<string, string>;
};

type WorksheetRowMatchType = 'eq' | 'cont';

type NamedResource = {
  id: string;
  name: string;
};

type WorksheetColumn = {
  id: string;
  name: string;
  dataType: string;
  hidden: boolean;
  required: boolean;
};

type WorksheetRow = {
  id: string;
  position: number | null;
  values: Record<string, string>;
};
