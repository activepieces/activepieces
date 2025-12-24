import { Static } from '@sinclair/typebox';
import { FieldType } from '../field';
export declare const CreateFieldRequest: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TLiteral<FieldType.STATIC_DROPDOWN>;
    tableId: import("@sinclair/typebox").TString;
    data: import("@sinclair/typebox").TObject<{
        options: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TString;
        }>>;
    }>;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<FieldType.TEXT>, import("@sinclair/typebox").TLiteral<FieldType.NUMBER>, import("@sinclair/typebox").TLiteral<FieldType.DATE>]>;
    tableId: import("@sinclair/typebox").TString;
    externalId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>]>;
export declare const UpdateFieldRequest: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
}>;
export type CreateFieldRequest = Static<typeof CreateFieldRequest>;
export type UpdateFieldRequest = Static<typeof UpdateFieldRequest>;
