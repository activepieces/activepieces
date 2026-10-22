export function showsFirstRun({
  listLoaded,
  hasAnyAgents,
  search,
  projectFiltered = false,
}: {
  listLoaded: boolean;
  hasAnyAgents: boolean;
  search: string;
  projectFiltered?: boolean;
}): boolean {
  return (
    listLoaded &&
    !hasAnyAgents &&
    search.trim().length === 0 &&
    !projectFiltered
  );
}

export function showsAgentList({
  listLoading,
  listFailed,
  hasList,
  firstRun,
}: {
  listLoading: boolean;
  listFailed: boolean;
  hasList: boolean;
  firstRun: boolean;
}): boolean {
  return listLoading || listFailed || (hasList && !firstRun);
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
