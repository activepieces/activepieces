import { Static } from '@sinclair/typebox';
export declare const PutStoreEntryRequest: import("@sinclair/typebox").TObject<{
    key: import("@sinclair/typebox").TString;
    value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
}>;
export type PutStoreEntryRequest = Static<typeof PutStoreEntryRequest>;
export declare const GetStoreEntryRequest: import("@sinclair/typebox").TObject<{
    key: import("@sinclair/typebox").TString;
}>;
export type GetStoreEntryRequest = Static<typeof GetStoreEntryRequest>;
export declare const DeleteStoreEntryRequest: import("@sinclair/typebox").TObject<{
    key: import("@sinclair/typebox").TString;
}>;
export type DeleteStoreEntryRequest = Static<typeof DeleteStoreEntryRequest>;
