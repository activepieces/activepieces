function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectionRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!isRecord(payload)) {
    return [];
  }
  const nestedKeys = ['data', 'locations', 'agents', 'items', 'results'];
  for (const key of nestedKeys) {
    const nested = payload[key];
    if (Array.isArray(nested)) {
      return nested;
    }
  }
  return [];
}

function totalPages(payload: unknown): number | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }
  const meta = payload['meta'];
  if (!isRecord(meta)) {
    return undefined;
  }
  const value = meta['total_pages'];
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return undefined;
}

function namedOptionsFromCollection(payload: unknown): {
  label: string;
  value: string;
}[] {
  return collectionRows(payload).flatMap((row) => {
    if (!isRecord(row)) {
      return [];
    }
    const id =
      row['id'] ??
      row['location_id'] ??
      row['agent_id'] ??
      row['kickcall_agent_id'];
    if (id === null || id === undefined) {
      return [];
    }
    const name =
      row['name'] ??
      row['label'] ??
      row['agent_name'] ??
      row['location_name'] ??
      String(id);
    return [
      {
        label: String(name),
        value: String(id),
      },
    ];
  });
}

function requestedPerPage(queryParams: Record<string, string> | undefined): number {
  const raw = queryParams?.['per_page'];
  if (raw === undefined) {
    return 100;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }
  return Math.floor(parsed);
}

function isLastCollectionPage({
  page,
  pageRowsLength,
  perPage,
  totalPagesFromMeta,
}: {
  page: number;
  pageRowsLength: number;
  perPage: number;
  totalPagesFromMeta: number | undefined;
}): boolean {
  if (totalPagesFromMeta !== undefined) {
    return page >= totalPagesFromMeta;
  }
  return pageRowsLength === 0 || pageRowsLength < perPage;
}

export const kickcallResponse = {
  collectionRows,
  totalPages,
  namedOptionsFromCollection,
  requestedPerPage,
  isLastCollectionPage,
};
