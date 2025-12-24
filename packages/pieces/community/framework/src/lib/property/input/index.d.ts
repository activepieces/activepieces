import { ArrayProperty } from './array-property';
import { CheckboxProperty } from './checkbox-property';
import { DateTimeProperty } from './date-time-property';
import { DropdownProperty, MultiSelectDropdownProperty } from './dropdown/dropdown-prop';
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from './dropdown/static-dropdown';
import { DynamicProperties } from './dynamic-prop';
import { FileProperty } from './file-property';
import { JsonProperty } from './json-property';
import { MarkDownProperty } from './markdown-property';
import { MarkdownVariant } from '@activepieces/shared';
import { NumberProperty } from './number-property';
import { ObjectProperty } from './object-property';
import { LongTextProperty, ShortTextProperty } from './text-property';
import { CustomProperty, CustomPropertyCodeFunctionParams } from './custom-property';
import { ColorProperty } from './color-property';
import { PieceAuthProperty } from '../authentication';
export declare const InputProperty: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
        disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            label: import("@sinclair/typebox").TString;
            value: import("@sinclair/typebox").TUnknown;
        }>>;
    }>, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    refreshers: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TSchema]>;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    properties: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        options: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
            disabled: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            placeholder: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                label: import("@sinclair/typebox").TString;
                value: import("@sinclair/typebox").TUnknown;
            }>>;
        }>, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>, import("@sinclair/typebox").TObject<{
        [x: string]: import("@sinclair/typebox").TSchema;
        [x: number]: import("@sinclair/typebox").TSchema;
        displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
        description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    }>]>>, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>, import("@sinclair/typebox").TObject<{
    [x: string]: import("@sinclair/typebox").TSchema;
    [x: number]: import("@sinclair/typebox").TSchema;
    displayName: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
    description: import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TSchema]>;
}>]>;
export type InputProperty = ShortTextProperty<boolean> | LongTextProperty<boolean> | MarkDownProperty | CheckboxProperty<boolean> | DropdownProperty<any, boolean, PieceAuthProperty | undefined | PieceAuthProperty[]> | StaticDropdownProperty<any, boolean> | NumberProperty<boolean> | ArrayProperty<boolean> | ObjectProperty<boolean> | JsonProperty<boolean> | MultiSelectDropdownProperty<unknown, boolean, PieceAuthProperty | undefined | PieceAuthProperty[]> | StaticMultiSelectDropdownProperty<unknown, boolean> | DynamicProperties<boolean, PieceAuthProperty | PieceAuthProperty[] | undefined> | DateTimeProperty<boolean> | FileProperty<boolean> | CustomProperty<boolean> | ColorProperty<boolean>;
type Properties<T> = Omit<T, 'valueSchema' | 'type' | 'defaultValidators' | 'defaultProcessors'>;
export declare const Property: {
    ShortText<R extends boolean>(request: Properties<ShortTextProperty<R>>): R extends true ? ShortTextProperty<true> : ShortTextProperty<false>;
    Checkbox<R extends boolean>(request: Properties<CheckboxProperty<R>>): R extends true ? CheckboxProperty<true> : CheckboxProperty<false>;
    LongText<R extends boolean>(request: Properties<LongTextProperty<R>>): R extends true ? LongTextProperty<true> : LongTextProperty<false>;
    MarkDown(request: {
        value: string;
        variant?: MarkdownVariant;
    }): MarkDownProperty;
    Number<R extends boolean>(request: Properties<NumberProperty<R>>): R extends true ? NumberProperty<true> : NumberProperty<false>;
    Json<R extends boolean>(request: Properties<JsonProperty<R>>): R extends true ? JsonProperty<true> : JsonProperty<false>;
    Array<R extends boolean>(request: Properties<ArrayProperty<R>>): R extends true ? ArrayProperty<true> : ArrayProperty<false>;
    Object<R extends boolean>(request: Properties<ObjectProperty<R>>): R extends true ? ObjectProperty<true> : ObjectProperty<false>;
    Dropdown<T, R extends boolean = boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined>(request: Properties<DropdownProperty<T, R, PieceAuth>>): R extends true ? DropdownProperty<T, true, PieceAuth> : DropdownProperty<T, false, PieceAuth>;
    StaticDropdown<T, R extends boolean = boolean>(request: Properties<StaticDropdownProperty<T, R>>): R extends true ? StaticDropdownProperty<T, true> : StaticDropdownProperty<T, false>;
    MultiSelectDropdown<T, R extends boolean = boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined>(request: Properties<MultiSelectDropdownProperty<T, R, PieceAuth>>): R extends true ? MultiSelectDropdownProperty<T, true, PieceAuth> : MultiSelectDropdownProperty<T, false, PieceAuth>;
    DynamicProperties<R extends boolean = boolean, PieceAuth extends PieceAuthProperty | PieceAuthProperty[] | undefined = undefined>(request: Properties<DynamicProperties<R, PieceAuth>>): R extends true ? DynamicProperties<true, PieceAuth> : DynamicProperties<false, PieceAuth>;
    StaticMultiSelectDropdown<T, R extends boolean = boolean>(request: Properties<StaticMultiSelectDropdownProperty<T, R>>): R extends true ? StaticMultiSelectDropdownProperty<T, true> : StaticMultiSelectDropdownProperty<T, false>;
    DateTime<R extends boolean>(request: Properties<DateTimeProperty<R>>): R extends true ? DateTimeProperty<true> : DateTimeProperty<false>;
    File<R extends boolean>(request: Properties<FileProperty<R>>): R extends true ? FileProperty<true> : FileProperty<false>;
    Custom<R extends boolean>(request: Omit<Properties<CustomProperty<R>>, "code"> & {
        /**
         * This is designed to be self-contained and operates independently of any
         * external libraries or imported dependencies. All necessary logic and
         * functionality are implemented within this function itself.
         *
         * You can return a cleanup function that will be called when the component is unmounted in the frontend.
         * */
        code: ((ctx: CustomPropertyCodeFunctionParams) => (() => void) | void);
    }): R extends true ? CustomProperty<true> : CustomProperty<false>;
    Color<R extends boolean>(request: Properties<ColorProperty<R>>): R extends true ? ColorProperty<true> : ColorProperty<false>;
};
export {};
