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

export function showsAgentList({
  listLoading,
  hasList,
  firstRun,
}: {
  listLoading: boolean;
  hasList: boolean;
  firstRun: boolean;
}): boolean {
  return listLoading || (hasList && !firstRun);
}

export function showsNoMatchNotice({
  matchCount,
  search,
  projectFiltered = false,
}: {
  matchCount: number;
  search: string;
  projectFiltered?: boolean;
}): boolean {
  return matchCount === 0 && (search.trim().length > 0 || projectFiltered);
}
