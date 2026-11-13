import { describe, expect, it } from 'vitest';
import { driveQuery } from './drive-query';

describe('driveQuery.escapeLiteral', () => {
  it('leaves plain text unchanged', () => {
    expect(driveQuery.escapeLiteral('Q3 budget')).toBe('Q3 budget');
  });

  it('escapes single quotes', () => {
    expect(driveQuery.escapeLiteral("Talal's report")).toBe("Talal\\'s report");
  });

  it('escapes backslashes before quotes so the quote escape is not undone', () => {
    expect(driveQuery.escapeLiteral("a\\'b")).toBe("a\\\\\\'b");
  });
});
