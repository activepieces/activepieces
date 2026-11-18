import { describe, expect, it } from 'vitest';
import { nuelinkOutputSchemas } from '../src/lib/output-schemas';

describe('collection output schemas match what Nuelink returns', () => {
  it('lists post counts and the evergreen interval on List Collections items', () => {
    const items = nuelinkOutputSchemas.listCollections.fields.find((field) => field.key === 'items');
    const keys = (items?.listItems ?? []).map((field) => field.key);
    expect(keys).toEqual(expect.arrayContaining(['postsCount', 'maxRepublish']));
  });

  it('does not promise post counts on a created or updated collection', () => {
    const keys = nuelinkOutputSchemas.collection.fields.map((field) => field.key);
    expect(keys).toContain('maxRepublish');
    expect(keys).not.toContain('postsCount');
  });
});
