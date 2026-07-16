import * as z from "zod/mini";


export const DropdownOption = z.object({
    label: z.string(),
    value: z.unknown(),
    description: z.optional(z.string()),
    icon: z.optional(z.string()),
})

export type DropdownOption<T> = {
    label: string;
    value: T;
    /** Secondary line shown under the label when the dropdown is rendered as cards. */
    description?: string;
    /** Named icon (mapped to a Lucide icon on the frontend) shown when rendered as cards. */
    icon?: string;
}

export const DropdownState = z.object({
    disabled: z.optional(z.boolean()),
    placeholder: z.optional(z.string()),
    options: z.array(DropdownOption)
})

export type DropdownState<T> = {
    disabled?: boolean;
    placeholder?: string;
    options: DropdownOption<T>[];
}

