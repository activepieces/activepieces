import { BasePieceAuthSchema } from "./common";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";

export type SecretTextProperty<R extends boolean> =
    BasePieceAuthSchema<string> &
    TPropertyValue<
        string,
        PropertyType.SECRET_TEXT,
        R
    >;
