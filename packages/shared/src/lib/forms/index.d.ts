import { Static } from '@sinclair/typebox';
export declare const FileResponseInterface: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    base64Url: import("@sinclair/typebox").TString;
    fileName: import("@sinclair/typebox").TString;
    extension: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>, import("@sinclair/typebox").TObject<{
    mimeType: import("@sinclair/typebox").TString;
    url: import("@sinclair/typebox").TString;
    fileName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>]>;
export type FileResponseInterface = Static<typeof FileResponseInterface>;
export declare enum HumanInputFormResultTypes {
    FILE = "file",
    MARKDOWN = "markdown"
}
export declare function createKeyForFormInput(displayName: string): string;
export declare const HumanInputFormResult: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<HumanInputFormResultTypes.FILE>;
    value: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        base64Url: import("@sinclair/typebox").TString;
        fileName: import("@sinclair/typebox").TString;
        extension: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, import("@sinclair/typebox").TObject<{
        mimeType: import("@sinclair/typebox").TString;
        url: import("@sinclair/typebox").TString;
        fileName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>]>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<HumanInputFormResultTypes.MARKDOWN>;
    value: import("@sinclair/typebox").TString;
    files: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        base64Url: import("@sinclair/typebox").TString;
        fileName: import("@sinclair/typebox").TString;
        extension: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>, import("@sinclair/typebox").TObject<{
        mimeType: import("@sinclair/typebox").TString;
        url: import("@sinclair/typebox").TString;
        fileName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>]>>>;
}>]>;
export type HumanInputFormResult = Static<typeof HumanInputFormResult>;
export declare const ChatFormResponse: import("@sinclair/typebox").TObject<{
    sessionId: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
    files: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export type ChatFormResponse = Static<typeof ChatFormResponse>;
