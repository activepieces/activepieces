import * as z from "zod/mini";
import { ApFile } from "./file-property";
import { PropertyType } from "./property-type";



export const BasePropertySchema = z.object({
    displayName: z.string(),
    description: z.optional(z.string()),
    advanced: z.optional(z.boolean()),
    /** Layout hint used inside a 'section' property group: 'half' pairs two-up, 'full' spans the row. */
    width: z.optional(z.enum(['half', 'full'])),
    /** Named icon (mapped to a Lucide icon on the frontend) shown for this property in the filter builder. */
    icon: z.optional(z.string()),
    /** Placeholder text shown in an empty text input (e.g. "sender@example.com"). */
    placeholder: z.optional(z.string()),
})

export type BasePropertySchema = z.infer<typeof BasePropertySchema>

export const TPropertyValue = <T extends z.ZodMiniType, U extends PropertyType>(_T: T, propertyType: U) => z.object({
    type: z.literal(propertyType),
    required: z.boolean(),
    defaultValue: z.optional(z.any()),
})

export type TPropertyValue<
  T,
  U extends PropertyType,
  REQUIRED extends boolean
> = {
  valueSchema: T;
  type: U;
  required: REQUIRED;
  // TODO this should be T or undefined
  defaultValue?: U extends PropertyType.ARRAY
    ? unknown[]
    : U extends PropertyType.JSON
    ? object
    : U extends PropertyType.CHECKBOX
    ? boolean
    : U extends PropertyType.LONG_TEXT
    ? string
    : U extends PropertyType.RICH_TEXT
    ? string
    : U extends PropertyType.SHORT_TEXT
    ? string
    : U extends PropertyType.NUMBER
    ? number
    : U extends PropertyType.DROPDOWN
    ? unknown
    : U extends PropertyType.MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_DROPDOWN
    ? unknown
    : U extends PropertyType.DATE_TIME
    ? string
    : U extends PropertyType.DATE_RANGE
    ? object
    : U extends PropertyType.FILE
    ? ApFile
    : U extends PropertyType.COLOR
    ? string
    : unknown;
};
