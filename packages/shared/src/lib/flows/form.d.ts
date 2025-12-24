import { Static } from '@sinclair/typebox';
export declare enum FormInputType {
    TEXT = "text",
    FILE = "file",
    TEXT_AREA = "text_area",
    TOGGLE = "toggle"
}
export declare const FormInput: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    required: import("@sinclair/typebox").TBoolean;
    description: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof FormInputType>;
}>;
export type FormInput = Static<typeof FormInput>;
export declare const FormProps: import("@sinclair/typebox").TObject<{
    inputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        required: import("@sinclair/typebox").TBoolean;
        description: import("@sinclair/typebox").TString;
        type: import("@sinclair/typebox").TEnum<typeof FormInputType>;
    }>>;
    waitForResponse: import("@sinclair/typebox").TBoolean;
}>;
export type FormProps = Static<typeof FormProps>;
export declare const FormResponse: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    title: import("@sinclair/typebox").TString;
    props: import("@sinclair/typebox").TObject<{
        inputs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
            displayName: import("@sinclair/typebox").TString;
            required: import("@sinclair/typebox").TBoolean;
            description: import("@sinclair/typebox").TString;
            type: import("@sinclair/typebox").TEnum<typeof FormInputType>;
        }>>;
        waitForResponse: import("@sinclair/typebox").TBoolean;
    }>;
    projectId: import("@sinclair/typebox").TString;
    version: import("@sinclair/typebox").TString;
}>;
export type FormResponse = Static<typeof FormResponse>;
export declare const ChatUIProps: import("@sinclair/typebox").TObject<{
    botName: import("@sinclair/typebox").TString;
}>;
export type ChatUIProps = Static<typeof ChatUIProps>;
export declare const ChatUIResponse: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    title: import("@sinclair/typebox").TString;
    props: import("@sinclair/typebox").TObject<{
        botName: import("@sinclair/typebox").TString;
    }>;
    projectId: import("@sinclair/typebox").TString;
    platformLogoUrl: import("@sinclair/typebox").TString;
    platformName: import("@sinclair/typebox").TString;
}>;
export type ChatUIResponse = Static<typeof ChatUIResponse>;
export declare const USE_DRAFT_QUERY_PARAM_NAME = "useDraft";
