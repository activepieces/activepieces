import { z } from "zod";
import { BasePieceAuthSchema } from "./common";
import { TPropertyValue } from "../input/common";
import { PropertyType } from "../input/property-type";

export const SecretTextProperty = z.object({
    ...BasePieceAuthSchema.shape,
    ...TPropertyValue(z.object({
        auth: z.string()
    }), PropertyType.SECRET_TEXT).shape,
})


export type SecretTextProperty<R extends boolean> =
    BasePieceAuthSchema<string> &
    TPropertyValue<
        string,
        PropertyType.SECRET_TEXT,
        R
    >;
