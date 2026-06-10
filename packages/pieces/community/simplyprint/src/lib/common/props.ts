import { HttpMethod } from '@activepieces/pieces-common';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from './client';
import {
  CustomField,
  Filament,
  Printer,
  QueueGroup,
  QueueItem,
  Tag,
} from './types';

const unauth = (label: string) => ({
  disabled: true,
  options: [],
  placeholder: `Connect your SimplyPrint account to load ${label}.`,
});

// `printers/Get` post_validation allows page_size up to 100, but its
// get_validation caps it at 25 (the panel's hard limit) — so the body is the
// only way to walk farms with >25 printers in a reasonable number of
// round-trips. Cap at 20 pages × 100 = 2000 to bound the call on
// pathological accounts.
async function fetchAllPrinters(auth: OAuth2PropertyValue): Promise<Printer[]> {
  const all: Printer[] = [];
  const pageSize = 100;
  const maxPages = 20;
  for (let page = 1; page <= maxPages; page++) {
    const res = await simplyprintClient.simplyprintCall<{
      data: Printer[];
      page_amount?: number;
    }>({
      auth,
      method: HttpMethod.POST,
      path: 'printers/Get',
      body: { page, page_size: pageSize },
    });
    const batch = res.data ?? [];
    all.push(...batch);
    const totalPages = res.page_amount ?? 1;
    if (page >= totalPages || batch.length < pageSize) break;
  }
  return all;
}

// Default printer-list response doesn't include a `groupName`, just the group
// id, so we suffix `(#id)` for disambiguation when names collide.
function printerLabel(p: Printer): string {
  const name = p.printer?.name ?? `Printer #${p.id}`;
  return `${name} (#${p.id})`;
}

const printerDropdown = (options: { required?: boolean; displayName?: string } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: options.displayName ?? 'Printer',
    description: 'Pick a printer from your account.',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('printers');
      try {
        const printers = await fetchAllPrinters(auth);
        return {
          disabled: false,
          options: printers.map((p) => ({ label: printerLabel(p), value: p.id })),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

const queueGroupDropdown = (options: { required?: boolean } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Queue group',
    description:
      'Which queue group to add the item to. Required if your account has queue groups configured. Leave empty only if no queue groups exist.',
    required: options.required ?? false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('queue groups');
      try {
        // Distinguish "no groups configured" from "groups exist but you
        // don't have access" via the `groups_exist` boolean.
        const res = await simplyprintClient.simplyprintCall<{
          list?: QueueGroup[];
          groups_exist?: boolean;
        }>({
          auth,
          method: HttpMethod.GET,
          path: 'queue/groups/Get',
        });
        const groups = res.list ?? [];
        if (groups.length === 0) {
          const placeholder = res.groups_exist
            ? "Queue groups exist but you don't have access to any of them."
            : 'No queue groups configured — leave this field empty.';
          return { disabled: true, options: [], placeholder };
        }
        return {
          disabled: false,
          options: groups.map((g) => ({ label: g.name, value: g.id })),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

// Use the filter path (any POST filter triggers it) for the unified
// `{queue: [...]}` shape and to cap page_size for big farms; the legacy GET
// path doesn't paginate. Bound to 20 pages × 100 = 2000 items so the dropdown
// stays responsive on accounts with very long queues; users with more should
// pick by id from an upstream step.
async function fetchAllQueueItems(auth: OAuth2PropertyValue): Promise<{
  items: QueueItem[];
  truncated: boolean;
}> {
  const all: QueueItem[] = [];
  const pageSize = 100;
  const maxPages = 20;
  let lastPageAmount = 1;
  let lastPage = 0;
  for (let page = 1; page <= maxPages; page++) {
    const res = await simplyprintClient.simplyprintCall<{
      queue: QueueItem[];
      page_amount?: number;
    }>({
      auth,
      method: HttpMethod.POST,
      path: 'queue/GetItems',
      body: { compact: true, page, page_size: pageSize },
    });
    const batch = res.queue ?? [];
    all.push(...batch);
    lastPage = page;
    lastPageAmount = res.page_amount ?? 1;
    if (page >= lastPageAmount || batch.length < pageSize) break;
  }
  return { items: all, truncated: lastPage < lastPageAmount };
}

const queueItemDropdown = (options: { required?: boolean } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Queue item',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('queue items');
      try {
        const { items, truncated } = await fetchAllQueueItems(auth);
        const opts = items.map((i) => ({
          label: i.filename ?? i.file_name ?? `Queue item #${i.id}`,
          value: i.id,
        }));
        return {
          disabled: false,
          options: opts,
          ...(truncated
            ? {
                placeholder: `Showing first ${opts.length} queue items — additional items exist; pick by ID from an upstream step if you need them.`,
              }
            : {}),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

const filamentDropdown = (options: { required?: boolean } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Filament',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('filaments');
      try {
        // `compact` is read from $this->POST, so this MUST be POST — a GET
        // with `compact=true` in the query string is silently ignored and
        // returns the heavy panel-shape (filament keyed by id).
        const res = await simplyprintClient.simplyprintCall<{ filament: Filament[] }>({
          auth,
          method: HttpMethod.POST,
          path: 'filament/GetFilament',
          body: { compact: true },
        });
        const filaments = res.filament ?? [];
        return {
          disabled: false,
          options: filaments.map((f) => {
            const typeName = typeof f.type === 'object' ? f.type?.name : f.type;
            const label =
              [f.brand, typeName, f.colorName].filter(Boolean).join(' ') || `Filament #${f.id}`;
            return { label, value: f.id };
          }),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

// `tags/Get` returns `{tags: [...]}` (not `{data: [...]}`) and responds with
// status:false + a message when the account has no custom tags — swallow
// that specific failure as an empty-state placeholder.
async function loadCompanyTags(
  auth: OAuth2PropertyValue,
): Promise<{ ok: true; tags: Tag[] } | { ok: false; placeholder: string }> {
  try {
    const res = await simplyprintClient.simplyprintCall<{ tags: Tag[] }>({
      auth,
      method: HttpMethod.GET,
      path: 'tags/Get',
    });
    return { ok: true, tags: res.tags ?? [] };
  } catch (e) {
    const msg = (e as Error).message ?? '';
    if (/no custom tags/i.test(msg)) {
      return {
        ok: false,
        placeholder: 'This account has no custom tags — create one in SimplyPrint first.',
      };
    }
    return { ok: false, placeholder: msg };
  }
}

const tagDropdown = (options: { required?: boolean } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Tag',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('tags');
      const r = await loadCompanyTags(auth);
      if (!r.ok) return { disabled: true, options: [], placeholder: r.placeholder };
      return {
        disabled: false,
        options: r.tags.map((t) => ({ label: t.name, value: t.id })),
      };
    },
  });

const tagMultiSelectDropdown = (
  options: { required?: boolean; displayName?: string; description?: string } = {},
) =>
  Property.MultiSelectDropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: options.displayName ?? 'Tags: Custom tags',
    description:
      options.description ??
      'Custom tags to apply. Leave empty to auto-tag from the gcode file (if applicable).',
    required: options.required ?? false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('tags');
      const r = await loadCompanyTags(auth);
      if (!r.ok) return { disabled: true, options: [], placeholder: r.placeholder };
      return {
        disabled: false,
        options: r.tags.map((t) => ({ label: t.name, value: t.id })),
      };
    },
  });

const nozzleSizeProp = () =>
  Property.Number({
    displayName: 'Tags: Nozzle size (mm)',
    description:
      'Target nozzle diameter, e.g. `0.4`. Leave empty to auto-tag from the gcode file.',
    required: false,
  });

const nozzleTypeProp = () =>
  Property.StaticDropdown<string>({
    displayName: 'Tags: Nozzle type',
    description: 'Nozzle material. Leave empty to auto-tag from the gcode file.',
    required: false,
    options: {
      options: [
        { label: 'Standard (Brass)', value: 'standard' },
        { label: 'Plated Brass', value: 'plated_brass' },
        { label: 'Hardened Steel', value: 'hardened_steel' },
        { label: 'Stainless Steel', value: 'stainless_steel' },
        { label: 'Tungsten Carbide', value: 'tungsten_carbide' },
        { label: 'Ruby Tipped', value: 'ruby_tipped' },
        { label: 'Hemispherical', value: 'hemispherical' },
      ],
    },
  });

const nozzleVolumeTypeProp = () =>
  Property.StaticDropdown<string>({
    displayName: 'Tags: Nozzle volume type',
    description: 'Nozzle flow category. Leave empty to auto-tag from the gcode file.',
    required: false,
    options: {
      options: [
        { label: 'Standard', value: 'standard' },
        { label: 'High Flow', value: 'high_flow' },
      ],
    },
  });

// Bed-type values are tagged with `enum:` or `custom:` so buildTagsBody can
// route them to the correct field on TagBedType.
const bedTypeDropdown = () =>
  Property.Dropdown<string, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Tags: Bed type',
    description: 'Printer bed surface. Leave empty to auto-tag from the gcode file.',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('bed types');
      try {
        const res = await simplyprintClient.simplyprintCall<{
          bedTypes?: Array<{ type?: string; fullName?: string }>;
          customBedTypes?: Array<{ id?: number; name?: string }>;
        }>({
          auth,
          method: HttpMethod.GET,
          path: 'printers/GetBedTypes',
        });
        const defaults = (res.bedTypes ?? [])
          .filter((b) => b.type)
          .map((b) => ({
            label: b.fullName ?? b.type!,
            value: `enum:${b.type}`,
          }));
        const customs = (res.customBedTypes ?? [])
          .filter((b) => typeof b.id === 'number')
          .map((b) => ({
            label: `${b.name ?? `#${b.id}`} (custom)`,
            value: `custom:${b.id}`,
          }));
        const all = [...defaults, ...customs];
        if (all.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'No bed types available for your printers — the gcode analyzer will auto-tag on upload.',
          };
        }
        return { disabled: false, options: all };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

// Backend's tag-assignment path (TagAssigningController + TagData schema)
// accepts: `custom` (tag IDs), `nozzle` (legacy float), `nozzleData` (array
// of {type, volumeType, size, i} — preferred), `bedType.type` (BedTypeEnum
// slug) or `bedType.custom` (CustomBedType id).
function buildTagsBody(input: {
  customTagIds?: number[];
  nozzleSize?: number;
  nozzleType?: string;
  nozzleVolumeType?: string;
  // Either `enum:<slug>`, `custom:<id>`, or a bare BedTypeEnum slug.
  bedType?: string;
}): Record<string, unknown> | undefined {
  const tags: Record<string, unknown> = {};

  if (input.customTagIds && input.customTagIds.length > 0) {
    tags['custom'] = input.customTagIds;
  }

  const hasNozzleSize = typeof input.nozzleSize === 'number' && input.nozzleSize > 0;
  const hasNozzleType = typeof input.nozzleType === 'string' && input.nozzleType.length > 0;
  const hasNozzleVolumeType =
    typeof input.nozzleVolumeType === 'string' && input.nozzleVolumeType.length > 0;
  if (hasNozzleSize || hasNozzleType || hasNozzleVolumeType) {
    const entry: Record<string, unknown> = { i: 0 };
    if (hasNozzleSize) entry['size'] = input.nozzleSize;
    if (hasNozzleType) entry['type'] = input.nozzleType;
    if (hasNozzleVolumeType) entry['volumeType'] = input.nozzleVolumeType;
    tags['nozzleData'] = [entry];
  }

  if (input.bedType && input.bedType.trim().length > 0) {
    const raw = input.bedType.trim();
    if (raw.startsWith('custom:')) {
      const id = parseInt(raw.slice('custom:'.length), 10);
      if (Number.isFinite(id) && id > 0) tags['bedType'] = { custom: id };
    } else {
      const slug = raw.startsWith('enum:') ? raw.slice('enum:'.length) : raw;
      if (slug.length > 0) tags['bedType'] = { type: slug };
    }
  }

  return Object.keys(tags).length > 0 ? tags : undefined;
}

const customFieldDropdown = (options: { required?: boolean; entity?: string } = {}) =>
  Property.Dropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: 'Custom field',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('custom fields');
      try {
        const res = await simplyprintClient.simplyprintCall<{ data: CustomField[] }>({
          auth,
          method: HttpMethod.POST,
          path: 'custom_fields/Get',
          body: { page: 1, page_size: 100 },
        });
        let fields = res.data ?? [];
        if (options.entity) fields = fields.filter((f) => f.entity === options.entity);
        return {
          disabled: false,
          options: fields.map((f) => ({
            label: `${f.name} (${f.field_type})`,
            value: f.id,
          })),
        };
      } catch (e) {
        const msg = (e as Error).message ?? '';
        if (/\b403\b|forbidden|oauth/i.test(msg)) {
          return {
            disabled: true,
            options: [],
            placeholder:
              'Custom-field endpoints are not yet granted to OAuth tokens. Use List Custom Fields to look up IDs.',
          };
        }
        return { disabled: true, options: [], placeholder: msg };
      }
    },
  });

// Multi-select of printer models in use on the company. Derived from the
// `printers/Get` response (each record has `printer.model` populated by
// `PrinterModel::getFormattedData`) — no dedicated list endpoint needed.
const printerModelMultiSelectDropdown = (
  options: { required?: boolean; displayName?: string; description?: string } = {},
) =>
  Property.MultiSelectDropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: options.displayName ?? 'Target printer models',
    description:
      options.description ??
      'Restrict to printers of specific models. Leave empty to auto-tag from the gcode file (if applicable). Built from the models your printers are using.',
    required: options.required ?? false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('printer models');
      try {
        const printers = await fetchAllPrinters(auth);
        const seen = new Map<number, string>();
        for (const p of printers) {
          const m = p.printer?.model;
          if (typeof m?.id === 'number' && !seen.has(m.id)) {
            const label = [m.brand, m.name].filter(Boolean).join(' ') || `Model #${m.id}`;
            seen.set(m.id, label);
          }
        }
        if (seen.size === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No printer models detected — add a printer first.',
          };
        }
        return {
          disabled: false,
          options: Array.from(seen.entries()).map(([id, label]) => ({ label, value: id })),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

const printerMultiSelectDropdown = (
  options: { required?: boolean; displayName?: string; description?: string } = {},
) =>
  Property.MultiSelectDropdown<number, boolean, typeof simplyprintAuth>({
    auth: simplyprintAuth,
    displayName: options.displayName ?? 'Printers',
    description: options.description ?? 'Pick one or more printers from your account.',
    required: options.required ?? true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) return unauth('printers');
      try {
        const printers = await fetchAllPrinters(auth);
        return {
          disabled: false,
          options: printers.map((p) => ({ label: printerLabel(p), value: p.id })),
        };
      } catch (e) {
        return { disabled: true, options: [], placeholder: (e as Error).message };
      }
    },
  });

const queuePositionProp = () =>
  Property.StaticDropdown({
    displayName: 'Insert at',
    description: 'Where in the queue to place the new item.',
    required: false,
    defaultValue: 'bottom',
    options: {
      options: [
        { label: 'Bottom of queue (default)', value: 'bottom' },
        { label: 'Top of queue', value: 'top' },
        { label: 'Specific position', value: 'specific' },
      ],
    },
  });

const queuePositionNumberProp = () =>
  Property.Number({
    displayName: 'Position number',
    description:
      'Only used when "Insert at" is "Specific position". 1-based index (1 = very top). Requires queue-reorder permission.',
    required: false,
  });

function resolveQueuePosition(
  picker: string | undefined,
  specificNumber: number | undefined,
): string {
  const v = picker ?? 'bottom';
  if (v === 'top' || v === 'bottom') return v;
  if (v === 'specific') {
    if (typeof specificNumber !== 'number' || specificNumber < 1) {
      throw new Error(
        '"Position number" is required (1 or greater) when "Insert at" is set to "Specific position".',
      );
    }
    return String(Math.floor(specificNumber));
  }
  return 'bottom';
}

export const simplyprintProps = {
  printerDropdown,
  queueGroupDropdown,
  queueItemDropdown,
  filamentDropdown,
  tagDropdown,
  tagMultiSelectDropdown,
  nozzleSizeProp,
  nozzleTypeProp,
  nozzleVolumeTypeProp,
  bedTypeDropdown,
  buildTagsBody,
  customFieldDropdown,
  printerModelMultiSelectDropdown,
  printerMultiSelectDropdown,
  queuePositionProp,
  queuePositionNumberProp,
  resolveQueuePosition,
};
