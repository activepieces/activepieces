/**
 * Friendly-view enrichment for Notion pages and database rows.
 *
 * Notion returns every page/row as a bag of richly-typed property objects
 * (`properties.<UserNamedColumn>.<type>...`). That shape can't be reached by a
 * static output-schema dot-path (the title column can be named anything and can
 * sit at any position), so the data selector and the "Friendly View" bury the
 * title and force 3-4 clicks per property value.
 *
 * `enrichPage` adds two computed top-level fields that a static schema CAN point
 * at, making a Notion payload read like Airtable's flat `fields` map:
 *   - `title`            plain text of the title property (any column name)
 *   - `property_values`  { columnName: scalar } for every property, flattened by type
 *
 * The raw `properties` object is left untouched, so existing flows and anyone
 * needing the rich objects keep working.
 */

type RichTextSegment = { plain_text?: string; text?: { content?: string } };
type NotionProperty = { type?: string; [key: string]: unknown };
type NotionUser = { id?: string; name?: string | null };

/** Join every segment of a Notion rich-text array into one trimmed string. */
export function richTextToPlain(rich: unknown): string {
  if (!Array.isArray(rich)) {
    return '';
  }
  return rich
    .map((seg: RichTextSegment) => seg?.plain_text ?? seg?.text?.content ?? '')
    .join('')
    .trim();
}

/**
 * The title of a page/row lives in the property whose `type` is `title`,
 * regardless of the column's name or position. Joins all segments so
 * multi-segment titles (mentions, formatting) aren't truncated.
 * Empty title array -> "" (viewer renders empty; Notion shows "Untitled").
 */
export function getPageTitle(
  page: { properties?: Record<string, NotionProperty> } | null | undefined
): string {
  const properties = page?.properties;
  if (!properties || typeof properties !== 'object') {
    return '';
  }
  for (const key of Object.keys(properties)) {
    const prop = properties[key];
    if (prop?.type === 'title') {
      return richTextToPlain(prop['title']);
    }
  }
  return '';
}

/**
 * A database OBJECT (not a row) carries its name in a top-level `title`
 * rich-text array. Joins all segments.
 */
export function getDatabaseTitle(
  database: { title?: unknown } | null | undefined
): string {
  return richTextToPlain(database?.title);
}

/**
 * Flatten a single Notion property value object to a scalar/short string by its
 * `type`. Every type Notion serves today is handled; anything unknown (a type
 * Notion adds next year, or a future API-version-only shape) maps to `null` and
 * never throws, so a new type can't break a live flow.
 */
export function flattenPropertyValue(
  prop: NotionProperty | null | undefined
): unknown {
  if (!prop || typeof prop !== 'object') {
    return null;
  }
  const type = prop.type;
  switch (type) {
    case 'title':
    case 'rich_text':
      return richTextToPlain(prop[type]);
    case 'select':
    case 'status': {
      const opt = prop[type] as { name?: string } | null;
      return opt?.name ?? null;
    }
    case 'multi_select': {
      const opts = (prop['multi_select'] as { name?: string }[]) ?? [];
      return opts.map((o) => o?.name ?? '').join(', ');
    }
    case 'date': {
      const d = prop['date'] as { start?: string; end?: string | null } | null;
      if (!d) {
        return null;
      }
      return d.end ? `${d.start} → ${d.end}` : d.start ?? null;
    }
    case 'people': {
      const users = (prop['people'] as NotionUser[]) ?? [];
      return users.map((u) => u?.name ?? u?.id ?? '').join(', ');
    }
    case 'created_by':
    case 'last_edited_by': {
      const u = prop[type] as NotionUser | null;
      return u?.name ?? u?.id ?? null;
    }
    case 'created_time':
    case 'last_edited_time':
      return (prop[type] as string) ?? null;
    case 'number':
      return (prop['number'] as number) ?? null;
    case 'checkbox':
      return (prop['checkbox'] as boolean) ?? null;
    case 'url':
    case 'email':
    case 'phone_number':
      return (prop[type] as string) ?? null;
    case 'files': {
      // Never surface the URL: internal Notion file URLs expire in ~1h.
      const files = (prop['files'] as { name?: string }[]) ?? [];
      return files.map((f) => f?.name ?? '').join(', ');
    }
    case 'formula': {
      const f = prop['formula'] as {
        type?: string;
        [k: string]: unknown;
      } | null;
      if (!f) {
        return null;
      }
      switch (f.type) {
        case 'string':
          return (f['string'] as string) ?? null;
        case 'number':
          return (f['number'] as number) ?? null;
        case 'boolean':
          return (f['boolean'] as boolean) ?? null;
        case 'date':
          return (f['date'] as { start?: string } | null)?.start ?? null;
        default:
          return null;
      }
    }
    case 'rollup': {
      const r = prop['rollup'] as {
        type?: string;
        [k: string]: unknown;
      } | null;
      if (!r) {
        return null;
      }
      switch (r.type) {
        case 'number':
          return (r['number'] as number) ?? null;
        case 'date':
          return (r['date'] as { start?: string } | null)?.start ?? null;
        case 'array':
          return ((r['array'] as NotionProperty[]) ?? [])
            .map((el) => flattenPropertyValue(el))
            .filter((v) => v !== null && v !== '')
            .join(', ');
        default:
          // 'incomplete' | 'unsupported'
          return null;
      }
    }
    case 'relation':
      // ids are meaningless to a human; the raw object keeps them.
      return ((prop['relation'] as unknown[]) ?? []).length;
    case 'unique_id': {
      const u = prop['unique_id'] as {
        prefix?: string | null;
        number?: number | null;
      } | null;
      if (!u || u.number === null || u.number === undefined) {
        return null;
      }
      return u.prefix ? `${u.prefix}-${u.number}` : String(u.number);
    }
    case 'verification': {
      const v = prop['verification'] as { state?: string } | null;
      return v?.state ?? null;
    }
    case 'button':
      return null;
    case 'place': {
      const pl = prop['place'] as {
        name?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        lat?: number;
        lon?: number;
      } | null;
      if (!pl) {
        return null;
      }
      const lat = pl.latitude ?? pl.lat;
      const lon = pl.longitude ?? pl.lon;
      return (
        pl.name ??
        pl.address ??
        (lat != null && lon != null ? `${lat}, ${lon}` : null)
      );
    }
    default:
      return null;
  }
}

/** Flatten every property of a page/row to `{ columnName: scalar }`. */
export function flattenProperties(
  properties: Record<string, NotionProperty> | null | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!properties || typeof properties !== 'object') {
    return out;
  }
  for (const key of Object.keys(properties)) {
    out[key] = flattenPropertyValue(properties[key]);
  }
  return out;
}

/**
 * Add `title` + `property_values` to a raw Notion page/row. Returns the page
 * unchanged if it isn't an object. Non-destructive: raw `properties` is kept.
 */
export function enrichPage<
  T extends { properties?: Record<string, NotionProperty> }
>(page: T): T & { title: string; property_values: Record<string, unknown> } {
  if (!page || typeof page !== 'object') {
    return page as T & {
      title: string;
      property_values: Record<string, unknown>;
    };
  }
  return {
    ...page,
    title: getPageTitle(page),
    property_values: flattenProperties(page.properties),
  };
}
