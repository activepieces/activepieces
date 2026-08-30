export function showsFirstRun({
  listLoaded,
  hasAnyAgents,
  search,
}: {
  listLoaded: boolean;
  hasAnyAgents: boolean;
  search: string;
}): boolean {
  return listLoaded && !hasAnyAgents && search.trim().length === 0;
}
