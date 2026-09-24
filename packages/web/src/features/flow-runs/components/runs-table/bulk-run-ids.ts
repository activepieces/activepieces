export function resolveBulkFlowRunIds({
  selectedAll,
  selectedRows,
  filteredRunIds,
}: {
  selectedAll: boolean;
  selectedRows: { id: string }[];
  filteredRunIds: string[];
}): string[] | undefined {
  if (!selectedAll) {
    return selectedRows.map((row) => row.id);
  }
  return filteredRunIds.length > 0 ? filteredRunIds : undefined;
}
