import { Type } from "@sinclair/typebox";
import { PropertyType } from "../property-type";
import { DynamicPropsValue } from "../dynamic-prop";
import { PiecePropertyMap } from "../..";

export const DropdownOption = Type.Object({
    label: Type.String(),
    value: Type.Unknown(),
})

export type DropdownOption<T> = {
    label: string;
    value: T;
}

export const DropdownState = Type.Object({
    disabled: Type.Optional(Type.Boolean()),
    placeholder: Type.Optional(Type.String()),
    options: Type.Array(DropdownOption)
})

export type DropdownState<T> = {
    disabled?: boolean;
    placeholder?: string;
    options: DropdownOption<T>[];
}


export type ExecutePropsResult<T extends PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC> = {
    type: T
    options: T extends PropertyType.DROPDOWN ? DropdownState<unknown> : T extends PropertyType.MULTI_SELECT_DROPDOWN ? DropdownState<unknown> : PiecePropertyMap
}
