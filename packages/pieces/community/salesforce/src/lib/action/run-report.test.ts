import { describe, expect, it } from 'vitest';
import { salesforce } from '../../index';

describe('runReport', () => {
  it('starts with empty filters so a new step uses the report saved filters', () => {
    const filters = salesforce.getAction('run_report')?.props['filters'];

    expect(filters).toBeDefined();
    expect(filters && 'defaultValue' in filters ? filters.defaultValue : undefined).toBeUndefined();
  });
});
