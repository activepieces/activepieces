import { httpClient } from '@activepieces/pieces-common';
import { drive_v3 } from '@googleapis/drive';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { driveSearchFiles } from '../src/lib/action/drive-search-files';
import { googleDriveSearchFolder } from '../src/lib/action/search-folder-or-file.action';
import { buildDriveSearchQuery, DRIVE_SEARCH_FIELD_CHOICES, DRIVE_SEARCH_FIELDS, DRIVE_SEARCH_OPERATOR_CHOICES } from '../src/lib/common/search-query';
import { googleDriveListFiles } from '../src/lib/action/list-files.action';
import { driveTestContext } from './drive-test-context';

const HOSTILE_VALUE = "it's \\ test";
const HOSTILE_FOLDER = "fo'lder\\";

function literalsOf({ q }: { q: string }): string[] {
  const literals: string[] = [];
  let index = 0;
  while (index < q.length) {
    if (q[index] !== "'") {
      index += 1;
      continue;
    }
    let literal = '';
    index += 1;
    while (index < q.length && q[index] !== "'") {
      if (q[index] === '\\') index += 1;
      literal += q[index];
      index += 1;
    }
    literals.push(literal);
    index += 1;
  }
  return literals;
}

beforeEach(() => {
  vi.spyOn(drive_v3.Resource$Files.prototype, 'list').mockImplementation((async () => ({ status: 200, data: { incompleteSearch: false, files: [] } })));
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((async () => ({ status: 200, headers: {}, body: { incompleteSearch: false, files: [] } })));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Drive q strings escape user values', () => {
  it('Search Files and Folders keeps a quote and a backslash inside the literal', async () => {
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: 'name', operator: 'contains', value: HOSTILE_VALUE, type: 'file', parent_folder_id: HOSTILE_FOLDER, include_team_drives: false } });
    await driveSearchFiles.run(context);
    const q = driveTestContext.listParams(vi.mocked(drive_v3.Resource$Files.prototype.list).mock.calls[0]).q ?? '';
    expect(q).toBe("name contains 'it\\'s \\\\ test' and 'fo\\'lder\\\\' in parents and mimeType!='application/vnd.google-apps.folder'");
    expect(literalsOf({ q })).toEqual([HOSTILE_VALUE, HOSTILE_FOLDER, 'application/vnd.google-apps.folder']);
  });

  it('List Files keeps a hostile folder id inside the parents literal', async () => {
    const context = driveTestContext.actionContext({ action: googleDriveListFiles, propsValue: { folderId: HOSTILE_FOLDER, depthLevel: 1, downloadFiles: false, include_team_drives: false, includeTrashed: false } });
    await googleDriveListFiles.run(context);
    const [request] = vi.mocked(httpClient.sendRequest).mock.calls[0];
    const q = new URL(request.url).searchParams.get('q') ?? '';
    expect(q).toBe("'fo\\'lder\\\\' in parents and trashed=false");
    expect(literalsOf({ q })).toEqual([HOSTILE_FOLDER]);
  });
});

describe('Drive search field and match operator', () => {
  const base = { query: 'report', parentFolder: undefined, type: 'all' };

  it('an injected search field throws and names the allowed fields', () => {
    expect(() => buildDriveSearchQuery({ ...base, queryTerm: "name contains 'a' or trashed", operator: 'contains' })).toThrow(
      `Unsupported search field 'name contains 'a' or trashed'. Use one of: ${DRIVE_SEARCH_FIELDS.join(', ')}.`
    );
  });

  it('an unknown match operator throws and names the allowed operators', () => {
    expect(() => buildDriveSearchQuery({ ...base, queryTerm: 'name', operator: "= 'x' or name !=" })).toThrow(
      "Unsupported match operator '= 'x' or name !='. Use one of: contains, =, !=, <, <=, >, >=."
    );
    expect(() => buildDriveSearchQuery({ ...base, queryTerm: 'name', operator: 'has' })).toThrow('Unsupported match operator');
  });

  it('every allowed field and operator still builds the same q as before', () => {
    const built = DRIVE_SEARCH_FIELD_CHOICES.flatMap((queryTerm) =>
      DRIVE_SEARCH_OPERATOR_CHOICES.map((operator) => buildDriveSearchQuery({ ...base, queryTerm, operator }))
    );
    expect(built).toEqual([
      "name contains 'report'",
      "name = 'report'",
      "fullText contains 'report'",
      "fullText = 'report'",
      "mimeType contains 'report'",
      "mimeType = 'report'",
    ]);
  });

  it('Search Files and Folders rejects an injected field before calling Drive', async () => {
    const context = driveTestContext.actionContext({ action: driveSearchFiles, propsValue: { query_term: "name contains 'a' or trashed", operator: 'contains', value: 'x', type: 'all', parent_folder_id: undefined, include_team_drives: false } });
    await expect(driveSearchFiles.run(context)).rejects.toThrow('Unsupported search field');
    expect(drive_v3.Resource$Files.prototype.list).not.toHaveBeenCalled();
  });

  it('both search dropdowns keep their original choices', () => {
    const values = (options: { value: unknown }[]) => options.map((option) => option.value);
    expect(values(driveSearchFiles.props.query_term.options.options)).toEqual(['name', 'fullText', 'mimeType']);
    expect(values(driveSearchFiles.props.operator.options.options)).toEqual(['contains', '=']);
    expect(values(googleDriveSearchFolder.props.queryTerm.options.options)).toEqual(['name', 'fullText', 'mimeType']);
    expect(values(googleDriveSearchFolder.props.operator.options.options)).toEqual(['contains', '=']);
  });

  it.each([
    { queryTerm: 'mimeType', operator: '!=', query: 'application/pdf', expected: "mimeType != 'application/pdf'" },
    { queryTerm: 'name', operator: '!=', query: 'draft', expected: "name != 'draft'" },
    { queryTerm: 'modifiedTime', operator: '>', query: '2025-01-01T00:00:00', expected: "modifiedTime > '2025-01-01T00:00:00'" },
    { queryTerm: 'createdTime', operator: '<=', query: '2025-01-01', expected: "createdTime <= '2025-01-01'" },
    { queryTerm: 'viewedByMeTime', operator: '>=', query: '2025-01-01', expected: "viewedByMeTime >= '2025-01-01'" },
    { queryTerm: 'sharedWithMeTime', operator: '<', query: '2025-01-01', expected: "sharedWithMeTime < '2025-01-01'" },
    { queryTerm: 'visibility', operator: '=', query: 'anyoneWithLink', expected: "visibility = 'anyoneWithLink'" },
    { queryTerm: 'shortcutDetails.targetId', operator: '=', query: "id'x", expected: "shortcutDetails.targetId = 'id\\'x'" },
  ])('a dynamic value main accepted still works: $expected', ({ queryTerm, operator, query, expected }) => {
    expect(buildDriveSearchQuery({ queryTerm, operator, query, parentFolder: undefined, type: 'all' })).toBe(expected);
  });

  it('Find File or Folder accepts a dynamic != operator and modifiedTime field as on main', async () => {
    const context = driveTestContext.actionContext({ action: googleDriveSearchFolder, propsValue: { queryTerm: 'modifiedTime', operator: '>', query: '2025-01-01T00:00:00', type: 'all', parentFolder: undefined, include_team_drives: false } });
    await googleDriveSearchFolder.run(context);
    const q = driveTestContext.listParams(vi.mocked(drive_v3.Resource$Files.prototype.list).mock.calls[0]).q;
    expect(q).toBe("modifiedTime > '2025-01-01T00:00:00'");
  });
});
