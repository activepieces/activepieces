import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AconexError } from '../src/lib/errors';
import { MAX_XML_BYTES, parseAconexXml } from '../src/lib/xml';

function fixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf8');
}

describe('parseAconexXml', () => {
  test('rejects a DOCTYPE before parse', () => {
    const body = '<!DOCTYPE foo [<!ENTITY xxe "EXPANDED">]><root>&xxe;</root>';
    expect(() => parseAconexXml(body)).toThrow(AconexError);
    try {
      parseAconexXml(body.toLowerCase());
    } catch (error) {
      expect(error).toBeInstanceOf(AconexError);
      expect((error as AconexError).code).toBe('XML_DOCTYPE_REJECTED');
      expect((error as AconexError).message).not.toContain('EXPANDED');
    }
  });

  test('does not expand custom or numeric entities', () => {
    const parsed = parseAconexXml('<root>&amp;&lt;&gt;&quot;&apos;&xxe;&#65;</root>') as { root: string };
    expect(parsed.root).toBe('&<>"\'&xxe;&#65;');
    expect(parsed.root).not.toContain('EXPANDED');
    expect(parsed.root).not.toBe('A');
  });

  test('keeps a document id above MAX_SAFE_INTEGER as a string', () => {
    const parsed = parseAconexXml(fixture('document-list.xml')) as {
      RegisterSearch: { SearchResults: { Document: Array<{ '@DocumentId': string; TrackingId: string; VersionNumber: string }> } };
    };
    const row = parsed.RegisterSearch.SearchResults.Document[0];
    expect(typeof row['@DocumentId']).toBe('string');
    expect(typeof row.TrackingId).toBe('string');
    expect(row.TrackingId).toBe('271341877549172398');
    expect(row.VersionNumber).toBe('2');
    expect(parsed).toEqual({
      RegisterSearch: {
        '@TotalResults': '1',
        '@TotalResultsOnPage': '1',
        '@TotalPages': '1',
        '@PageSize': '25',
        '@CurrentPage': '1',
        SearchResults: {
          Document: [
            {
              '@DocumentId': '1879093137',
              DocumentNumber: 'DWG-001',
              Title: 'Shop drawing',
              Revision: 'A',
              DocumentType: 'Shop Drawing',
              Author: 'Ada Lovelace',
              Filename: 'dwg-001.pdf',
              FileSize: '1024',
              FileType: 'pdf',
              TrackingId: '271341877549172398',
              DateModified: '2026-01-15T00:00:00.000Z',
              VersionNumber: '2',
            },
          ],
        },
      },
    });
    expect(parsed).not.toHaveProperty('registered');
  });

  test('rejects a body over 20 MB', () => {
    const body = `<root>${'a'.repeat(MAX_XML_BYTES)}</root>`;
    expect(body.length).toBeGreaterThan(MAX_XML_BYTES);
    expect(() => parseAconexXml(body)).toThrow(AconexError);
    try {
      parseAconexXml(body);
    } catch (error) {
      expect((error as AconexError).code).toBe('RESPONSE_TOO_LARGE');
    }
  });

  test('keeps one project as an array and unescapes only the five entities', () => {
    const parsed = parseAconexXml(fixture('projects.xml')) as {
      ProjectResults: { SearchResults: { Project: Array<Record<string, string>> } };
    };
    expect(Array.isArray(parsed.ProjectResults.SearchResults.Project)).toBe(true);
    const project = parsed.ProjectResults.SearchResults.Project[0];
    expect(project.ProjectId).toBe('1879048400');
    expect(typeof project.ProjectId).toBe('string');
    expect(project.ProjectName).toBe('Hotel VIP Resort & Spa');
    expect(project['@Active']).toBe('true');
  });

  test('keeps MailData and does not invent MailBody', () => {
    const parsed = parseAconexXml(fixture('mail-get.xml')) as { Mail: Record<string, string> };
    expect(parsed.Mail.MailData).toBe('Please review the shop drawing.');
    expect(parsed.Mail).not.toHaveProperty('MailBody');
    expect(parsed.Mail).not.toHaveProperty('body');
    expect(parsed.Mail['@MailId']).toBe('1879053088');
  });
});
