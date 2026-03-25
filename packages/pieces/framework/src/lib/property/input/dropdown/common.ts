import { z } from "zod";


export const DropdownOption = z.object({
    label: z.string(),
    value: z.unknown(),
})

export type DropdownOption<T> = {
    label: string;
    value: T;
}

export const DropdownState = z.object({
    disabled: z.boolean().optional(),
    placeholder: z.string().optional(),
    options: z.array(DropdownOption)
})

export type DropdownState<T> = {
    disabled?: boolean;
    placeholder?: string;
    options: DropdownOption<T>[];
}

