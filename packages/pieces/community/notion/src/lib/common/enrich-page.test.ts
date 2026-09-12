import {
  richTextToPlain,
  getPageTitle,
  getDatabaseTitle,
  flattenPropertyValue,
  flattenProperties,
  enrichPage,
} from './enrich-page';

const rt = (text: string) => ({
  type: 'text',
  text: { content: text, link: null },
  plain_text: text,
  href: null,
  annotations: {},
});
const prop = (type: string, extra: Record<string, unknown>) => ({
  id: 'x',
  type,
  ...extra,
});

describe('richTextToPlain', () => {
  it('joins all segments and trims', () => {
    expect(richTextToPlain([rt('Take '), rt('Fig '), rt('on a walk')])).toBe(
      'Take Fig on a walk'
    );
  });
  it('handles a mention segment (still carries plain_text)', () => {
    const mention = { type: 'mention', plain_text: '@Kareem', href: null };
    expect(richTextToPlain([rt('cc '), mention])).toBe('cc @Kareem');
  });
  it('empty array -> ""', () => expect(richTextToPlain([])).toBe(''));
  it('non-array -> ""', () => {
    expect(richTextToPlain(null)).toBe('');
    expect(richTextToPlain(undefined)).toBe('');
  });
});

describe('flattenPropertyValue — all 24 types', () => {
  it('1. title -> joined plain text', () =>
    expect(
      flattenPropertyValue(
        prop('title', { title: [rt('Hello'), rt(' World')] })
      )
    ).toBe('Hello World'));
  it('1b. empty title array -> ""', () =>
    expect(flattenPropertyValue(prop('title', { title: [] }))).toBe(''));

  it('2. rich_text -> joined plain text', () =>
    expect(
      flattenPropertyValue(prop('rich_text', { rich_text: [rt('a'), rt('b')] }))
    ).toBe('ab'));
  it('2b. empty rich_text -> ""', () =>
    expect(flattenPropertyValue(prop('rich_text', { rich_text: [] }))).toBe(
      ''
    ));

  it('3. select -> name', () =>
    expect(
      flattenPropertyValue(prop('select', { select: { name: 'Doing' } }))
    ).toBe('Doing'));
  it('3b. select null -> null', () =>
    expect(flattenPropertyValue(prop('select', { select: null }))).toBeNull());

  it('4. status -> name', () =>
    expect(
      flattenPropertyValue(prop('status', { status: { name: 'In progress' } }))
    ).toBe('In progress'));
  it('4b. status null -> null', () =>
    expect(flattenPropertyValue(prop('status', { status: null }))).toBeNull());

  it('5. multi_select -> joined names', () =>
    expect(
      flattenPropertyValue(
        prop('multi_select', { multi_select: [{ name: 'a' }, { name: 'b' }] })
      )
    ).toBe('a, b'));
  it('5b. multi_select [] -> ""', () =>
    expect(
      flattenPropertyValue(prop('multi_select', { multi_select: [] }))
    ).toBe(''));

  it('6. date start only', () =>
    expect(
      flattenPropertyValue(
        prop('date', { date: { start: '2026-09-10', end: null } })
      )
    ).toBe('2026-09-10'));
  it('6b. date with end -> "start → end"', () =>
    expect(
      flattenPropertyValue(
        prop('date', {
          date: { start: '2026-09-10', end: '2026-09-12', time_zone: 'GMT' },
        })
      )
    ).toBe('2026-09-10 → 2026-09-12'));
  it('6c. datetime start', () =>
    expect(
      flattenPropertyValue(
        prop('date', { date: { start: '2026-09-10T09:00:00.000Z' } })
      )
    ).toBe('2026-09-10T09:00:00.000Z'));
  it('6d. date null -> null', () =>
    expect(flattenPropertyValue(prop('date', { date: null }))).toBeNull());

  it('7. people -> names joined; partial (id-only) falls back to id', () =>
    expect(
      flattenPropertyValue(
        prop('people', {
          people: [
            { object: 'user', id: 'u1', name: 'Alice' },
            { object: 'user', id: 'u2' }, // partial, id only — seen live
          ],
        })
      )
    ).toBe('Alice, u2'));

  it('8. created_by (bot user) -> name', () =>
    expect(
      flattenPropertyValue(
        prop('created_by', {
          created_by: {
            object: 'user',
            id: 'b1',
            name: 'Activepieces',
            type: 'bot',
          },
        })
      )
    ).toBe('Activepieces'));
  it('8b. created_by without name -> id', () =>
    expect(
      flattenPropertyValue(
        prop('created_by', { created_by: { object: 'user', id: 'b1' } })
      )
    ).toBe('b1'));

  it('9. last_edited_by -> name ?? id', () =>
    expect(
      flattenPropertyValue(
        prop('last_edited_by', { last_edited_by: { id: 'u9', name: 'Bob' } })
      )
    ).toBe('Bob'));

  it('10. created_time passthrough', () =>
    expect(
      flattenPropertyValue(
        prop('created_time', { created_time: '2023-03-02T01:43:00.000Z' })
      )
    ).toBe('2023-03-02T01:43:00.000Z'));
  it('11. last_edited_time passthrough', () =>
    expect(
      flattenPropertyValue(
        prop('last_edited_time', {
          last_edited_time: '2023-03-02T01:43:00.000Z',
        })
      )
    ).toBe('2023-03-02T01:43:00.000Z'));

  it('12. number passthrough; 0 is a value', () => {
    expect(flattenPropertyValue(prop('number', { number: 42 }))).toBe(42);
    expect(flattenPropertyValue(prop('number', { number: 0 }))).toBe(0);
    expect(flattenPropertyValue(prop('number', { number: null }))).toBeNull();
  });

  it('13. checkbox passthrough; false is a value', () => {
    expect(flattenPropertyValue(prop('checkbox', { checkbox: true }))).toBe(
      true
    );
    expect(flattenPropertyValue(prop('checkbox', { checkbox: false }))).toBe(
      false
    );
  });

  it('14. url / 15. email / 16. phone_number passthrough + null', () => {
    expect(flattenPropertyValue(prop('url', { url: 'https://x.com' }))).toBe(
      'https://x.com'
    );
    expect(flattenPropertyValue(prop('url', { url: null }))).toBeNull();
    expect(flattenPropertyValue(prop('email', { email: 'a@b.com' }))).toBe(
      'a@b.com'
    );
    expect(
      flattenPropertyValue(prop('phone_number', { phone_number: '+123' }))
    ).toBe('+123');
    expect(
      flattenPropertyValue(prop('phone_number', { phone_number: null }))
    ).toBeNull();
  });

  it('17. files -> names only (internal + external), never URLs', () =>
    expect(
      flattenPropertyValue(
        prop('files', {
          files: [
            {
              name: 'a.pdf',
              file: { url: 'https://s3/expiring', expiry_time: 'x' },
            },
            { name: 'b.png', external: { url: 'https://ext/b.png' } },
          ],
        })
      )
    ).toBe('a.pdf, b.png'));

  it('18. formula — all 4 kinds + unsupported', () => {
    expect(
      flattenPropertyValue(
        prop('formula', { formula: { type: 'string', string: 'hi' } })
      )
    ).toBe('hi');
    expect(
      flattenPropertyValue(
        prop('formula', { formula: { type: 'number', number: 7 } })
      )
    ).toBe(7);
    expect(
      flattenPropertyValue(
        prop('formula', { formula: { type: 'boolean', boolean: false } })
      )
    ).toBe(false);
    expect(
      flattenPropertyValue(
        prop('formula', {
          formula: { type: 'date', date: { start: '2026-01-01' } },
        })
      )
    ).toBe('2026-01-01');
    expect(
      flattenPropertyValue(
        prop('formula', {
          formula: {
            type: 'date',
            date: { start: '2026-01-01', end: '2026-01-03' },
          },
        })
      )
    ).toBe('2026-01-01 → 2026-01-03');
    expect(
      flattenPropertyValue(
        prop('formula', { formula: { type: 'date', date: null } })
      )
    ).toBeNull();
    expect(
      flattenPropertyValue(
        prop('formula', { formula: { type: 'unsupported' } })
      )
    ).toBeNull();
  });

  it('19. rollup — number / date / array; incomplete + unsupported -> null', () => {
    expect(
      flattenPropertyValue(
        prop('rollup', {
          rollup: { type: 'number', number: 3, function: 'count' },
        })
      )
    ).toBe(3);
    expect(
      flattenPropertyValue(
        prop('rollup', {
          rollup: {
            type: 'date',
            date: { start: '2026-02-02' },
            function: 'latest_date',
          },
        })
      )
    ).toBe('2026-02-02');
    expect(
      flattenPropertyValue(
        prop('rollup', {
          rollup: {
            type: 'array',
            function: 'show_original',
            array: [
              { type: 'title', title: [rt('One')] },
              { type: 'select', select: { name: 'Two' } },
              { type: 'number', number: 3 },
            ],
          },
        })
      )
    ).toBe('One, Two, 3');
    expect(
      flattenPropertyValue(
        prop('rollup', { rollup: { type: 'incomplete', function: 'x' } })
      )
    ).toBeNull();
    expect(
      flattenPropertyValue(
        prop('rollup', { rollup: { type: 'unsupported', function: 'x' } })
      )
    ).toBeNull();
  });

  it('20. relation -> count', () =>
    expect(
      flattenPropertyValue(
        prop('relation', {
          relation: [{ id: 'r1' }, { id: 'r2' }],
          has_more: false,
        })
      )
    ).toBe(2));
  it('20b. relation with has_more (Notion caps at 25 ids) -> "N+"', () =>
    expect(
      flattenPropertyValue(
        prop('relation', {
          relation: Array.from({ length: 25 }, (_, i) => ({ id: `r${i}` })),
          has_more: true,
        })
      )
    ).toBe('25+'));
  it('20c. empty relation -> 0', () =>
    expect(
      flattenPropertyValue(prop('relation', { relation: [], has_more: false }))
    ).toBe(0));

  it('21. unique_id -> "PREFIX-123" or "123"; number null -> null', () => {
    expect(
      flattenPropertyValue(
        prop('unique_id', { unique_id: { prefix: 'TASK', number: 123 } })
      )
    ).toBe('TASK-123');
    expect(
      flattenPropertyValue(
        prop('unique_id', { unique_id: { prefix: null, number: 7 } })
      )
    ).toBe('7');
    expect(
      flattenPropertyValue(
        prop('unique_id', { unique_id: { prefix: 'X', number: null } })
      )
    ).toBeNull();
  });

  it('22. verification -> state', () => {
    expect(
      flattenPropertyValue(
        prop('verification', { verification: { state: 'verified' } })
      )
    ).toBe('verified');
    expect(
      flattenPropertyValue(
        prop('verification', { verification: { state: 'unverified' } })
      )
    ).toBe('unverified');
    expect(
      flattenPropertyValue(prop('verification', { verification: null }))
    ).toBeNull();
  });

  it('23. button -> null', () =>
    expect(flattenPropertyValue(prop('button', { button: {} }))).toBeNull());

  it('24. place -> name ?? address ?? "lat, lon"', () => {
    expect(
      flattenPropertyValue(
        prop('place', {
          place: { name: 'HQ', address: 'x', latitude: 1, longitude: 2 },
        })
      )
    ).toBe('HQ');
    expect(
      flattenPropertyValue(
        prop('place', {
          place: { address: '10 Main St', latitude: 1, longitude: 2 },
        })
      )
    ).toBe('10 Main St');
    expect(
      flattenPropertyValue(
        prop('place', { place: { latitude: 1.5, longitude: 2.5 } })
      )
    ).toBe('1.5, 2.5');
  });

  it('forward-compat: unknown type -> null (never throws)', () => {
    expect(
      flattenPropertyValue(
        prop('some_future_type_2027', { some_future_type_2027: { x: 1 } })
      )
    ).toBeNull();
    expect(flattenPropertyValue(null)).toBeNull();
    expect(flattenPropertyValue(undefined)).toBeNull();
    expect(flattenPropertyValue({} as never)).toBeNull();
  });
});

describe('flattenProperties', () => {
  it('flattens a whole property bag, keeping column names (incl. spaces)', () => {
    const props = {
      Name: prop('title', { title: [rt('fIX ERROR ')] }),
      Status: prop('select', { select: { name: 'To Do' } }),
      'Due Date': prop('date', { date: { start: '2025-02-28' } }),
    };
    expect(flattenProperties(props)).toEqual({
      Name: 'fIX ERROR',
      Status: 'To Do',
      'Due Date': '2025-02-28',
    });
  });
  it('null/garbage -> {}', () => {
    expect(flattenProperties(null)).toEqual({});
    expect(flattenProperties(undefined)).toEqual({});
  });
});

describe('getPageTitle', () => {
  it('finds title by type, any column name (row: "Name")', () => {
    const page = {
      properties: {
        Status: prop('select', { select: { name: 'x' } }),
        Name: prop('title', { title: [rt('Take Fig on a walk')] }),
      },
    };
    expect(getPageTitle(page)).toBe('Take Fig on a walk');
  });
  it('standalone page title column literally named "title"', () => {
    const page = {
      properties: { title: prop('title', { title: [rt('Saas Ideas')] }) },
    };
    expect(getPageTitle(page)).toBe('Saas Ideas');
  });
  it('title NOT first (6th of 6) still found', () => {
    const page = {
      properties: {
        A: prop('rich_text', { rich_text: [rt('a')] }),
        B: prop('select', { select: { name: 'b' } }),
        C: prop('date', { date: { start: '2026-01-01' } }),
        D: prop('people', { people: [] }),
        E: prop('number', { number: 5 }),
        Name: prop('title', { title: [rt('Weekly Sync')] }),
      },
    };
    expect(getPageTitle(page)).toBe('Weekly Sync');
  });
  it('empty title array -> ""', () => {
    const page = { properties: { Name: prop('title', { title: [] }) } };
    expect(getPageTitle(page)).toBe('');
  });
  it('no title property / no properties -> ""', () => {
    expect(
      getPageTitle({ properties: { Foo: prop('select', { select: null }) } })
    ).toBe('');
    expect(getPageTitle({})).toBe('');
    expect(getPageTitle(null)).toBe('');
  });
});

describe('getDatabaseTitle', () => {
  it('joins top-level title rich-text array', () =>
    expect(getDatabaseTitle({ title: [rt('My '), rt('DB')] })).toBe('My DB'));
  it('missing -> ""', () => expect(getDatabaseTitle({})).toBe(''));
});

describe('enrichPage', () => {
  it('adds title + property_values, keeps raw properties intact', () => {
    const page = {
      object: 'page',
      id: 'p1',
      properties: {
        Name: prop('title', { title: [rt('fIX ERROR ')] }),
        Status: prop('select', { select: { name: 'To Do' } }),
      },
    };
    const e = enrichPage(page);
    expect(e.title).toBe('fIX ERROR');
    expect(e.property_values).toEqual({ Name: 'fIX ERROR', Status: 'To Do' });
    expect(e.properties).toBe(page.properties); // raw untouched
    expect(e.id).toBe('p1');
  });
  it('empty title row -> title "" (Notion shows "Untitled")', () => {
    const e = enrichPage({
      properties: { Name: prop('title', { title: [] }) },
    });
    expect(e.title).toBe('');
  });
  it('standalone page (only a title column)', () => {
    const e = enrichPage({
      parent: { type: 'page_id' },
      properties: { title: prop('title', { title: [rt('Saas Ideas')] }) },
    });
    expect(e.title).toBe('Saas Ideas');
    expect(e.property_values).toEqual({ title: 'Saas Ideas' });
  });
  it('non-object input passes through', () => {
    expect(enrichPage(null as never)).toBeNull();
  });
});
