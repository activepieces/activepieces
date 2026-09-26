import { describe, expect, it } from 'vitest';
import { dropboxCommon } from './common';

describe('unwrapEntry', () => {
  it('returns the first entry when Dropbox reports success', () => {
    const entry = { '.tag': 'success', metadata: { name: 'doc.txt' } };
    expect(
      dropboxCommon.unwrapEntry({ entries: [entry], action: 'lock the file' })
    ).toEqual(entry);
  });

  it('throws when the single entry failed, so a per-entry failure is not reported as success', () => {
    const entries = [
      { '.tag': 'failure', failure: { '.tag': 'path_lookup' } },
    ];
    expect(() =>
      dropboxCommon.unwrapEntry({ entries, action: 'lock the file' })
    ).toThrowError(/could not lock the file/);
  });

  it('includes the failure payload in the message', () => {
    const entries = [{ '.tag': 'failure', failure: { '.tag': 'not_found' } }];
    expect(() =>
      dropboxCommon.unwrapEntry({ entries, action: 'unlock the file' })
    ).toThrowError(/not_found/);
  });

  it('throws when Dropbox returns no entries at all', () => {
    expect(() =>
      dropboxCommon.unwrapEntry({ entries: [], action: 'read the file lock' })
    ).toThrowError(/no result entry/);
  });

  it('throws when the entries field is missing rather than returning undefined', () => {
    expect(() =>
      dropboxCommon.unwrapEntry({ entries: undefined, action: 'lock the file' })
    ).toThrowError(/no result entry/);
  });
});

describe('previewExtensionFor', () => {
  it('uses html when Dropbox returns an HTML preview', () => {
    expect(dropboxCommon.previewExtensionFor('text/html')).toBe('html');
  });

  it('uses pdf for the PDF preview content type', () => {
    expect(dropboxCommon.previewExtensionFor('application/pdf')).toBe('pdf');
  });

  it('falls back to pdf when the content type is absent', () => {
    expect(dropboxCommon.previewExtensionFor(undefined)).toBe('pdf');
  });
});