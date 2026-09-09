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
  hasList,
  firstRun,
}: {
  listLoading: boolean;
  hasList: boolean;
  firstRun: boolean;
}): boolean {
  return listLoading || (hasList && !firstRun);
}

export function shownDestination({
  isBuilding,
  buildingIn,
  picked,
}: {
  isBuilding: boolean;
  buildingIn: string | null;
  picked: string;
}): string {
  return isBuilding && buildingIn !== null ? buildingIn : picked;
}

export function acceptsDraftPrompt({
  prompt,
  isBuilding,
  readinessUnknown,
}: {
  prompt: string;
  isBuilding: boolean;
  readinessUnknown: boolean;
}): boolean {
  return prompt.trim().length > 0 && !isBuilding && !readinessUnknown;
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
