import { Static, Type } from "@sinclair/typebox";

export const PutStoreEntryRequest = Type.Object({
    key: Type.String({}),
    value: Type.Any({}),
});

export type PutStoreEntryRequest = Static<typeof PutStoreEntryRequest>;
