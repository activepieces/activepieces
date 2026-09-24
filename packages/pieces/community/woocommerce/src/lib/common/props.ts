import { propsValidation } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';

function pageProp() {
  return Property.Number({
    displayName: 'Page',
    description:
      'Page number, starting at 1. If a page comes back with exactly per_page items, request the next page to see more.',
    required: false,
    defaultValue: 1,
  });
}

function perPageProp() {
  return Property.Number({
    displayName: 'Per Page',
    description: 'Number of items per page, from 1 to 100. Defaults to 10.',
    required: false,
    defaultValue: 10,
  });
}

function sortOrderProp() {
  return Property.StaticDropdown({
    displayName: 'Sort Direction',
    description: 'Ascending or descending. Defaults to descending.',
    required: false,
    options: {
      options: [
        { label: 'Descending', value: 'desc' },
        { label: 'Ascending', value: 'asc' },
      ],
    },
  });
}

function triStateProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
    },
  });
}

function stockStatusProp({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Stock Status',
    description,
    required: false,
    options: { options: stockStatusOptions },
  });
}

function permanentProp({ resource }: { resource: string }) {
  return Property.Checkbox({
    displayName: 'Delete Permanently',
    description: `When off (the default) the ${resource} is moved to the trash and can be restored from the WordPress admin. When on it is deleted for good.`,
    required: false,
    defaultValue: false,
  });
}

async function paging({
  page,
  perPage,
}: {
  page: number | undefined;
  perPage: number | undefined;
}): Promise<{ page: number; per_page: number }> {
  await propsValidation.validateZod(
    { page, per_page: perPage },
    {
      page: z.optional(z.number().check(z.minimum(1))),
      per_page: z.optional(z.number().check(z.minimum(1), z.maximum(100))),
    }
  );
  return { page: page ?? 1, per_page: perPage ?? 10 };
}

function resolveTriState(value: string | undefined | null): boolean | undefined {
  if (value === 'yes') {
    return true;
  }
  if (value === 'no') {
    return false;
  }
  return undefined;
}

function toIdList(values: unknown[] | undefined | null): number[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }
  return values.map((value) => {
    const parsed = Number(String(value).trim());
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(
        `Expected a list of numeric ids, but got "${String(value)}". Read the ids with the matching list action first.`
      );
    }
    return parsed;
  });
}

function toStringList(
  values: unknown[] | undefined | null
): string[] | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }
  return values
    .map((value) => String(value).trim())
    .filter((value) => value.length > 0);
}

function pruneUndefined(
  record: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

function nonEmpty(value: string | undefined | null): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function reportRangeProps() {
  return {
    period: Property.StaticDropdown({
      displayName: 'Period',
      description: 'Preset period to report on. Leave empty when using a date range; if both are empty the current week is used.',
      required: false,
      options: {
        options: [
          { label: 'This week', value: 'week' },
          { label: 'This month', value: 'month' },
          { label: 'Last month', value: 'last_month' },
          { label: 'This year', value: 'year' },
        ],
      },
    }),
    date_min: Property.ShortText({
      displayName: 'Start Date',
      description: 'First day of a custom range, as YYYY-MM-DD. Use together with End Date instead of Period.',
      required: false,
    }),
    date_max: Property.ShortText({
      displayName: 'End Date',
      description: 'Last day of a custom range, as YYYY-MM-DD. Use together with Start Date instead of Period.',
      required: false,
    }),
  };
}

function resolveReportRange({
  period,
  dateMin,
  dateMax,
}: {
  period: string | undefined | null;
  dateMin: string | undefined | null;
  dateMax: string | undefined | null;
}): Record<string, string | undefined> {
  const min = nonEmpty(dateMin);
  const max = nonEmpty(dateMax);
  if ((min && !max) || (!min && max)) {
    throw new Error('Provide both Start Date and End Date for a custom range, or neither.');
  }
  if (period && min) {
    throw new Error('Provide either Period or a Start Date and End Date range, not both.');
  }
  if (min && max) {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(min) || !datePattern.test(max)) {
      throw new Error('Start Date and End Date must be in YYYY-MM-DD format.');
    }
    return { date_min: min, date_max: max };
  }
  return { period: period ?? undefined };
}

const stockStatusOptions = [
  { label: 'In stock', value: 'instock' },
  { label: 'Out of stock', value: 'outofstock' },
  { label: 'On backorder', value: 'onbackorder' },
];

const orderStatusOptions = [
  { label: 'Pending payment', value: 'pending' },
  { label: 'Processing', value: 'processing' },
  { label: 'On hold', value: 'on-hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' },
  { label: 'Trash', value: 'trash' },
];

const productStatusOptions = [
  { label: 'Published', value: 'publish' },
  { label: 'Draft', value: 'draft' },
  { label: 'Pending review', value: 'pending' },
  { label: 'Private', value: 'private' },
];

const productTypeOptions = [
  { label: 'Simple', value: 'simple' },
  { label: 'Variable', value: 'variable' },
  { label: 'Grouped', value: 'grouped' },
  { label: 'External / affiliate', value: 'external' },
];

export const wooProps = {
  pageProp,
  perPageProp,
  sortOrderProp,
  triStateProp,
  stockStatusProp,
  permanentProp,
  reportRangeProps,
  stockStatusOptions,
  orderStatusOptions,
  productStatusOptions,
  productTypeOptions,
};

export const wooValues = {
  paging,
  resolveTriState,
  toIdList,
  toStringList,
  pruneUndefined,
  nonEmpty,
  resolveReportRange,
};
