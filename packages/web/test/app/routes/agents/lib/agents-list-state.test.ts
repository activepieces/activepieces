import { describe, expect, it } from 'vitest';

import { showsFirstRun } from '@/app/routes/agents/lib/agents-list-state';

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
