import { describe, expect, it } from 'vitest';

import { listUtils } from '@/lib/list-utils';

describe('listUtils.cap', () => {
  const actions = Array.from({ length: 34 }, (_, index) => `action_${index}`);

  it('shows the first five and counts the rest', () => {
    const capped = listUtils.cap({ items: actions, limit: 5, expanded: false });
    expect(capped.visible).toEqual(actions.slice(0, 5));
    expect(capped.hiddenCount).toBe(29);
  });

  it('shows everything once expanded, in the same order', () => {
    const capped = listUtils.cap({ items: actions, limit: 5, expanded: true });
    expect(capped.visible).toEqual(actions);
    expect(capped.hiddenCount).toBe(0);
  });

  it('does not cap a short list', () => {
    const capped = listUtils.cap({
      items: actions.slice(0, 5),
      limit: 5,
      expanded: false,
    });
    expect(capped).toEqual({ visible: actions.slice(0, 5), hiddenCount: 0 });
  });
});

describe('listUtils.freezeRows', () => {
  const source = ['gmail', 'slack', 'notion'];
  let hidden = new Set<string>();
  const shownRows = () => source.filter((name) => !hidden.has(name));

  it('keeps a toggled row in place while the filter stays the same', () => {
    hidden = new Set();
    const first = listUtils.freezeRows({
      previous: null,
      filterKey: 'shown|',
      source,
      computeNames: shownRows,
    });
    hidden = new Set(['slack']);
    const afterToggle = listUtils.freezeRows({
      previous: first,
      filterKey: 'shown|',
      source,
      computeNames: shownRows,
    });
    expect(afterToggle.names).toEqual(['gmail', 'slack', 'notion']);
    expect(afterToggle.names.indexOf('notion')).toBe(2);
  });

  it('recomputes the rows when the filter or search changes', () => {
    hidden = new Set(['slack']);
    const frozen = listUtils.freezeRows({
      previous: { filterKey: 'shown|', source, names: source },
      filterKey: 'shown|no',
      source,
      computeNames: () => shownRows().filter((name) => name.includes('no')),
    });
    expect(frozen.names).toEqual(['notion']);
  });

  it('recomputes the rows when the list itself reloads', () => {
    hidden = new Set(['slack']);
    const frozen = listUtils.freezeRows({
      previous: { filterKey: 'shown|', source, names: source },
      filterKey: 'shown|',
      source: [...source],
      computeNames: shownRows,
    });
    expect(frozen.names).toEqual(['gmail', 'notion']);
  });
});

describe('listUtils.cappedHeight', () => {
  it('fits a short list to its rows', () => {
    expect(
      listUtils.cappedHeight({
        count: 3,
        rowHeight: 40,
        padding: 10,
        max: 288,
      }),
    ).toBe(130);
  });

  it('stops growing at the cap', () => {
    expect(
      listUtils.cappedHeight({
        count: 200,
        rowHeight: 40,
        padding: 10,
        max: 288,
      }),
    ).toBe(288);
  });
});
