import { Type } from "@sinclair/typebox";
import { BasePieceAuthSchema } from "./common";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";

export const SecretTextProperty = Type.Composite([
    BasePieceAuthSchema,
    TPropertyValue(Type.Object({
        auth: Type.String()
    }), PropertyType.SECRET_TEXT)
])


export type SecretTextProperty<R extends boolean> =
    BasePieceAuthSchema<string> &
    TPropertyValue<
        string,
        PropertyType.SECRET_TEXT,
        R
    >;