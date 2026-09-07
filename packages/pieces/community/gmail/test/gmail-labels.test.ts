import { gmailLabels } from '../src/lib/common/gmail-labels';

describe('gmailLabels', () => {
  it('accepts a label object or a raw id string', () => {
    expect(gmailLabels.resolveId({ id: 'Label_1', name: 'Work' })).toBe(
      'Label_1'
    );
    expect(gmailLabels.resolveId(' INBOX ')).toBe('INBOX');
    expect(gmailLabels.resolveName({ id: 'Label_1', name: 'Work' })).toBe(
      'Work'
    );
    expect(gmailLabels.resolveName('INBOX')).toBe('INBOX');
  });

  it('rejects empty label values', () => {
    expect(() => gmailLabels.resolveId(undefined)).toThrow(/label ID/);
    expect(() => gmailLabels.resolveId({ name: 'Work' })).toThrow(/label ID/);
    expect(() => gmailLabels.resolveId('   ')).toThrow(/label ID/);
  });
});
