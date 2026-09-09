import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  acceptsDraftPrompt,
  showsAgentList,
  showsFirstRun,
  showsNoMatchNotice,
  shownDestination,
} from '@/app/routes/agents/lib/agents-list-state';

const loaded = { listLoaded: true, hasAnyAgents: false, search: '' };

describe('showsFirstRun', () => {
  it('is a first run for an account whose list came back empty', () => {
    expect(showsFirstRun(loaded)).toBe(true);
  });

  it('needs a loaded list, which is what a failed or paused query does not give', () => {
    expect(showsFirstRun({ ...loaded, listLoaded: false })).toBe(false);
  });

  it('is not a first run once an agent exists', () => {
    expect(showsFirstRun({ ...loaded, hasAnyAgents: true })).toBe(false);
  });

  it('is not a first run when a search matched nothing, since the search must stay clearable', () => {
    expect(showsFirstRun({ ...loaded, search: 'invoices' })).toBe(false);
  });

  it.each(['   ', '\t', '\n'])(
    'treats a blank search (%j) as no search at all',
    (search) => {
      expect(showsFirstRun({ ...loaded, search })).toBe(true);
    },
  );
});

describe('showsAgentList', () => {
  const settled = { listLoading: false, hasList: true, firstRun: false };

  it('keeps the list on screen when a refetch fails over agents already loaded', () => {
    expect(showsAgentList(settled)).toBe(true);
  });

  it('shows the section while the very first load is still running', () => {
    expect(
      showsAgentList({ listLoading: true, hasList: false, firstRun: false }),
    ).toBe(true);
  });

  it('gives the page to the first run instead', () => {
    expect(showsAgentList({ ...settled, firstRun: true })).toBe(false);
  });

  it('renders nothing before any list has arrived', () => {
    expect(
      showsAgentList({ listLoading: false, hasList: false, firstRun: false }),
    ).toBe(false);
  });
});

describe('showsNoMatchNotice', () => {
  it('says nothing matched only when someone typed a search', () => {
    expect(showsNoMatchNotice({ matchCount: 0, search: 'invoices' })).toBe(
      true,
    );
  });

  it('stays quiet when an empty list is not the result of a search', () => {
    expect(showsNoMatchNotice({ matchCount: 0, search: '' })).toBe(false);
  });

  it('stays quiet while the search has matches', () => {
    expect(showsNoMatchNotice({ matchCount: 2, search: 'invoices' })).toBe(
      false,
    );
  });

  it('treats a blank search as no search', () => {
    expect(showsNoMatchNotice({ matchCount: 0, search: '   ' })).toBe(false);
  });
});

describe('the status the page reads as listLoaded', () => {
  const listKey = ['agents', 'all'];

  const clientWhoseRefetchFails = () => {
    let calls = 0;
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const queryFn = () => {
      calls += 1;
      return calls === 1
        ? Promise.resolve({ data: [], next: null })
        : Promise.reject(new Error('network down'));
    };
    return { client, queryFn };
  };

  it('leaves the query in error, not success, when a refetch fails over cached empty data', async () => {
    const { client, queryFn } = clientWhoseRefetchFails();
    await client.fetchQuery({ queryKey: listKey, queryFn });
    await client.refetchQueries({ queryKey: listKey }).catch(() => undefined);

    const state = client.getQueryState(listKey);
    expect(state?.status).toBe('error');
    expect(state?.data).toEqual({ data: [], next: null });
    expect(
      showsFirstRun({
        listLoaded: state?.status === 'success',
        hasAnyAgents: false,
        search: '',
      }),
    ).toBe(false);
  });
});

describe('showsNoMatchNotice with a project filter', () => {
  it('explains an empty grid when a project hides everything and there is no search', () => {
    expect(
      showsNoMatchNotice({
        matchCount: 0,
        search: '',
        projectFiltered: true,
      }),
    ).toBe(true);
  });

  it('stays quiet when the project filter is off and nothing was searched', () => {
    expect(
      showsNoMatchNotice({
        matchCount: 0,
        search: '',
        projectFiltered: false,
      }),
    ).toBe(false);
  });

  it('still speaks for a search that matches nothing inside a project', () => {
    expect(
      showsNoMatchNotice({
        matchCount: 0,
        search: 'nothing',
        projectFiltered: true,
      }),
    ).toBe(true);
  });
});

describe('showsFirstRun with a project filter', () => {
  it('does not offer the first-run hero when a project simply has no agents', () => {
    expect(
      showsFirstRun({
        listLoaded: true,
        hasAnyAgents: false,
        search: '',
        projectFiltered: true,
      }),
    ).toBe(false);
  });

  it('still offers it when nothing is filtered and the platform has none', () => {
    expect(
      showsFirstRun({
        listLoaded: true,
        hasAnyAgents: false,
        search: '',
        projectFiltered: false,
      }),
    ).toBe(true);
  });
});

describe('acceptsDraftPrompt', () => {
  const ready = {
    prompt: 'summarise my inbox',
    isBuilding: false,
    readinessUnknown: false,
  };

  it('accepts a prompt once the destination is known to be ready', () => {
    expect(acceptsDraftPrompt(ready)).toBe(true);
  });

  it('refuses while the destination project has not answered about its provider', () => {
    expect(acceptsDraftPrompt({ ...ready, readinessUnknown: true })).toBe(
      false,
    );
  });

  it('refuses a second submit while one is already building', () => {
    expect(acceptsDraftPrompt({ ...ready, isBuilding: true })).toBe(false);
  });

  it('refuses whitespace', () => {
    expect(acceptsDraftPrompt({ ...ready, prompt: '   ' })).toBe(false);
  });
});

describe('shownDestination', () => {
  it('holds the project a build started in, even after the pick changes', () => {
    expect(
      shownDestination({
        isBuilding: true,
        buildingIn: 'project_a',
        picked: 'project_b',
      }),
    ).toBe('project_a');
  });

  it('follows the pick again once the build is over', () => {
    expect(
      shownDestination({
        isBuilding: false,
        buildingIn: 'project_a',
        picked: 'project_b',
      }),
    ).toBe('project_b');
  });

  it('falls back to the pick when nothing was captured', () => {
    expect(
      shownDestination({
        isBuilding: true,
        buildingIn: null,
        picked: 'project_b',
      }),
    ).toBe('project_b');
  });
});
