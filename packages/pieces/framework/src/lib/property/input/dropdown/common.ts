export type DropdownOption<T> = {
    label: string;
    value: T;
    description?: string;
    icon?: string;
}

export type DropdownState<T> = {
    disabled?: boolean;
    placeholder?: string;
    options: DropdownOption<T>[];
}

