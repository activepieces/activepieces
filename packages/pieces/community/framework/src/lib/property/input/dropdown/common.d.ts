export declare const DropdownOption: import("@sinclair/typebox").TObject<{
    label: import("@sinclair/typebox").TString;
    value: import("@sinclair/typebox").TUnknown;
}>;
export type DropdownOption<T> = {
    label: string;
    value: T;
};
export declare const DropdownState: import("@sinclair/typebox").TObject<{
    disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        label: import("@sinclair/typebox").TString;
        value: import("@sinclair/typebox").TUnknown;
    }>>;
}>;
export type DropdownState<T> = {
    disabled?: boolean;
    placeholder?: string;
    options: DropdownOption<T>[];
};
