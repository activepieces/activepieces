import * as z from "zod/mini";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";


export const DateRangePreset = z.enum([
    'any_time',
    'last_24_hours',
    'last_7_days',
    'last_30_days',
    'last_90_days',
    'this_month',
    'custom',
])
export type DateRangePreset = z.infer<typeof DateRangePreset>

export const DateRangeValue = z.object({
    preset: z.optional(DateRangePreset),
    after: z.optional(z.string()),
    before: z.optional(z.string()),
})
export type DateRangeValue = {
    preset?: DateRangePreset;
    after?: string;
    before?: string;
}

export const DateRangeProperty = z.object({
    ...BasePropertySchema.shape,
    display: z.optional(z.enum(['dropdown'])),
    ...TPropertyValue(DateRangeValue, PropertyType.DATE_RANGE).shape,
})

export type DateRangeProperty<R extends boolean> = BasePropertySchema & {
    /** 'dropdown' renders the presets as a compact select (used by the filter builder) instead of pill buttons. */
    display?: 'dropdown';
} & TPropertyValue<DateRangeValue, PropertyType.DATE_RANGE, R>;


function isoDaysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function startOfThisMonth(): string {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

// Resolve a (possibly relative) date-range value into concrete ISO bounds.
// Relative presets are resolved against "now" so recurring flows roll forward.
function resolve(
    value: DateRangeValue | null | undefined,
): { after?: string; before?: string } {
    if (!value || !value.preset || value.preset === 'any_time') {
        return {};
    }
    switch (value.preset) {
        case 'last_24_hours':
            return { after: isoDaysAgo(1) };
        case 'last_7_days':
            return { after: isoDaysAgo(7) };
        case 'last_30_days':
            return { after: isoDaysAgo(30) };
        case 'last_90_days':
            return { after: isoDaysAgo(90) };
        case 'this_month':
            return { after: startOfThisMonth() };
        case 'custom':
            return {
                after: value.after && value.after.length > 0 ? value.after : undefined,
                before:
                    value.before && value.before.length > 0 ? value.before : undefined,
            };
        default:
            return {};
    }
}

export const dateRangeUtils = { resolve };
