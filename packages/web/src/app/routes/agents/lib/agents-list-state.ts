function showsFirstRun({
  isLoading,
  agentCount,
  search,
}: {
  isLoading: boolean;
  agentCount: number;
  search: string;
}): boolean {
  // A search that matches nothing is not a first run: the list chrome has to stay so the person
  // can clear the search and see what they have.
  return !isLoading && agentCount === 0 && search.trim().length === 0;
}

export const agentsListState = { showsFirstRun };
