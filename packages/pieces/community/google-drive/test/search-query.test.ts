/// <reference types="vitest/globals" />

import { buildDriveSearchQuery } from '../src/lib/common/search-query';

const base = {
  queryTerm: 'name',
  operator: 'contains',
  query: 'Quarterly report',
  parentFolder: undefined,
  type: 'all',
};

describe('buildDriveSearchQuery', () => {
  it('builds a plain name search', () => {
    expect(buildDriveSearchQuery(base)).toBe("name contains 'Quarterly report'");
  });

  it('escapes apostrophes in the search text', () => {
    expect(buildDriveSearchQuery({ ...base, query: "Tom's notes" })).toBe(
      "name contains 'Tom\\'s notes'"
    );
  });

  it('escapes backslashes before apostrophes in the search text', () => {
    expect(buildDriveSearchQuery({ ...base, query: "a\\'b" })).toBe(
      "name contains 'a\\\\\\'b'"
    );
  });

  it('keeps an injected clause inside the literal', () => {
    const query = buildDriveSearchQuery({
      ...base,
      query: "x' or trashed=true and name contains 'y",
    });
    expect(query).toBe(
      "name contains 'x\\' or trashed=true and name contains \\'y'"
    );
  });

  it('escapes the parent folder id', () => {
    expect(
      buildDriveSearchQuery({ ...base, parentFolder: "id' or '1'='1" })
    ).toBe("name contains 'Quarterly report' and 'id\\' or \\'1\\'=\\'1' in parents");
  });

  it('omits the parents clause when no folder is chosen', () => {
    expect(buildDriveSearchQuery({ ...base, parentFolder: '' })).not.toContain(
      'in parents'
    );
  });

  it('narrows to files or folders', () => {
    expect(buildDriveSearchQuery({ ...base, type: 'file' })).toBe(
      "name contains 'Quarterly report' and mimeType!='application/vnd.google-apps.folder'"
    );
    expect(buildDriveSearchQuery({ ...base, type: 'folder' })).toBe(
      "name contains 'Quarterly report' and mimeType='application/vnd.google-apps.folder'"
    );
  });

  it('uses the chosen term and operator', () => {
    expect(
      buildDriveSearchQuery({ ...base, queryTerm: 'mimeType', operator: '=', query: 'text/csv' })
    ).toBe("mimeType = 'text/csv'");
  });
});
