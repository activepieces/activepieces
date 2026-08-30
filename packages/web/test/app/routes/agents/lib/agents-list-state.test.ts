import { describe, expect, it } from 'vitest';

import { agentsListState } from '@/app/routes/agents/lib/agents-list-state';

describe('agentsListState.showsFirstRun', () => {
  it('is a first run for an account with no agents', () => {
    expect(
      agentsListState.showsFirstRun({
        isLoading: false,
        agentCount: 0,
        search: '',
      }),
    ).toBe(true);
  });

  it('is not a first run while the list is still loading, so the page does not flash the invitation', () => {
    expect(
      agentsListState.showsFirstRun({
        isLoading: true,
        agentCount: 0,
        search: '',
      }),
    ).toBe(false);
  });

  it('is not a first run once an agent exists', () => {
    expect(
      agentsListState.showsFirstRun({
        isLoading: false,
        agentCount: 1,
        search: '',
      }),
    ).toBe(false);
  });

  it('is not a first run when a search matched nothing, since the search must stay clearable', () => {
    expect(
      agentsListState.showsFirstRun({
        isLoading: false,
        agentCount: 0,
        search: 'invoices',
      }),
    ).toBe(false);
  });

  it.each(['   ', '\t', '\n'])(
    'treats a blank search (%j) as no search at all',
    (search) => {
      expect(
        agentsListState.showsFirstRun({
          isLoading: false,
          agentCount: 0,
          search,
        }),
      ).toBe(true);
    },
  );
});
