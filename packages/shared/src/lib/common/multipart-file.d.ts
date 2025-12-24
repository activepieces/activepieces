import { Static } from '@sinclair/typebox';
export declare const ApMultipartFile: import("@sinclair/typebox").TObject<{
    filename: import("@sinclair/typebox").TString;
    data: import("@sinclair/typebox").TUnknown;
    type: import("@sinclair/typebox").TLiteral<"file">;
    mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ApMultipartFile = Static<typeof ApMultipartFile> & {
    data: Buffer;
};
export declare const isMultipartFile: (value: unknown) => value is ApMultipartFile;
