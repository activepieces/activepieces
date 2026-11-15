type RichTextSegment = { plain_text?: string; text?: { content?: string } };
type NotionProperty = { type?: string; [key: string]: unknown };
type NotionUser = { id?: string; name?: string | null };

export function richTextToPlain(rich: unknown): string {
  if (!Array.isArray(rich)) {
    return '';
  }
  return rich
    .map((seg: RichTextSegment) => seg?.plain_text ?? seg?.text?.content ?? '')
    .join('')
    .trim();
}

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

export function getDatabaseTitle(
  database: { title?: unknown } | null | undefined
): string {
  return richTextToPlain(database?.title);
}

function formatDate(
  d: { start?: string | null; end?: string | null } | null | undefined
): string | null {
  if (!d?.start) {
    return null;
  }
  return d.end ? `${d.start} → ${d.end}` : d.start;
}

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
    case 'date':
      return formatDate(
        prop['date'] as { start?: string; end?: string | null } | null
      );
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
          return formatDate(
            f['date'] as { start?: string; end?: string | null } | null
          );
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
          return formatDate(
            r['date'] as { start?: string; end?: string | null } | null
          );
        case 'array':
          return ((r['array'] as NotionProperty[]) ?? [])
            .map((el) => flattenPropertyValue(el))
            .filter((v) => v !== null && v !== '')
            .join(', ');
        default:
          return null;
      }
    }
    case 'relation': {
      const count = ((prop['relation'] as unknown[]) ?? []).length;
      return prop['has_more'] === true ? `${count}+` : count;
    }
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
