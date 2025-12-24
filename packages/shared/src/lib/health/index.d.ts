import { Static } from '@sinclair/typebox';
export declare const GetSystemHealthChecksResponse: import("@sinclair/typebox").TObject<{
    cpu: import("@sinclair/typebox").TBoolean;
    disk: import("@sinclair/typebox").TBoolean;
    ram: import("@sinclair/typebox").TBoolean;
}>;
export type GetSystemHealthChecksResponse = Static<typeof GetSystemHealthChecksResponse>;
