import { Static } from '@sinclair/typebox';
export declare enum PropertyExecutionType {
    MANUAL = "MANUAL",
    DYNAMIC = "DYNAMIC"
}
export declare const PropertySettings: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof PropertyExecutionType>;
    schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export type PropertySettings = Static<typeof PropertySettings>;
