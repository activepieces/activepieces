/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const SESSION_PROJECT_ID = 'sessionProject0000001';
const OTHER_PROJECT_ID = 'otherProject000000001';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => SESSION_PROJECT_ID },
}));

const { useMcpNav } = await import('@/app/routes/mcp-server/mcp-nav');

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function projectIdFor(url: string): string | null {
  const seen: Array<string | null> = [];
  function Probe() {
    seen.push(useMcpNav().projectId);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/mcp-server/:tab" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return seen[seen.length - 1];
}

describe('useMcpNav project', () => {
  it('takes the project from the address', () => {
    expect(projectIdFor(`/mcp-server/tools?project=${OTHER_PROJECT_ID}`)).toBe(
      OTHER_PROJECT_ID,
    );
  });

  it('falls back to the session project when the address names none', () => {
    expect(projectIdFor('/mcp-server/tools')).toBe(SESSION_PROJECT_ID);
  });

  it('ignores a value that is not a project id, so a crafted link cannot reach another path', () => {
    expect(projectIdFor('/mcp-server/tools?project=..')).toBe(
      SESSION_PROJECT_ID,
    );
  });
});
