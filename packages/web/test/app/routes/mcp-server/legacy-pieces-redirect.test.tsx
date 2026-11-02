/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { LegacyPiecesRedirect } from '@/app/routes/mcp-server/legacy-pieces-redirect';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function landingFor(url: string): string {
  const seen: string[] = [];
  function Probe() {
    const location = useLocation();
    seen.push(`${location.pathname}${location.search}`);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/mcp-server/pieces" element={<LegacyPiecesRedirect />} />
          <Route path="/mcp-server/:tab" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );
  });
  return seen[seen.length - 1];
}

describe('LegacyPiecesRedirect', () => {
  it('sends the old Pieces tab to the Pieces segment of Tools, keeping the project', () => {
    expect(landingFor('/mcp-server/pieces?project=project-1')).toBe(
      '/mcp-server/tools?project=project-1&segment=pieces',
    );
  });

  it('opens the Pieces segment without a project when none was given', () => {
    expect(landingFor('/mcp-server/pieces')).toBe(
      '/mcp-server/tools?segment=pieces',
    );
  });
});
