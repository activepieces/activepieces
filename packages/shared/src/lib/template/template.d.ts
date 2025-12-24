import { Static } from '@sinclair/typebox';
export declare const TemplateTag: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    color: import("@sinclair/typebox").TString;
    icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type TemplateTag = Static<typeof TemplateTag>;
export declare enum TemplateType {
    OFFICIAL = "OFFICIAL",
    SHARED = "SHARED",
    CUSTOM = "CUSTOM"
}
export declare enum TemplateCategory {
    ANALYTICS = "ANALYTICS",
    COMMUNICATION = "COMMUNICATION",
    CONTENT = "CONTENT",
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
    DEVELOPMENT = "DEVELOPMENT",
    E_COMMERCE = "E_COMMERCE",
    FINANCE = "FINANCE",
    HR = "HR",
    IT_OPERATIONS = "IT_OPERATIONS",
    MARKETING = "MARKETING",
    PRODUCTIVITY = "PRODUCTIVITY",
    SALES = "SALES"
}
export declare const FlowVersionTemplate: import("@sinclair/typebox").TObject<{
    displayName: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.PIECE>;
        settings: import("@sinclair/typebox").TObject<{
            sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            }>>;
            propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                type: import("@sinclair/typebox").TEnum<typeof import("../flows").PropertyExecutionType>;
                schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
            }>>;
            customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            pieceName: import("@sinclair/typebox").TString;
            pieceVersion: import("@sinclair/typebox").TString;
            triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        }>;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.EMPTY>;
        settings: import("@sinclair/typebox").TAny;
        name: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        displayName: import("@sinclair/typebox").TString;
        nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>]>;
    schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type FlowVersionTemplate = Static<typeof FlowVersionTemplate>;
export declare enum TemplateStatus {
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare const Template: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TEnum<typeof TemplateType>;
    summary: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    tags: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    blogUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    usageCount: import("@sinclair/typebox").TNumber;
    author: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TemplateCategory>>;
    pieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    platformId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    flows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.PIECE>;
            settings: import("@sinclair/typebox").TObject<{
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                    type: import("@sinclair/typebox").TEnum<typeof import("../flows").PropertyExecutionType>;
                    schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                pieceName: import("@sinclair/typebox").TString;
                pieceVersion: import("@sinclair/typebox").TString;
                triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.EMPTY>;
            settings: import("@sinclair/typebox").TAny;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>]>;
        schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    }>>>;
    status: import("@sinclair/typebox").TEnum<typeof TemplateStatus>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Template = Static<typeof Template>;
export declare const SharedTemplate: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TEnum<typeof TemplateType>;
    name: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TemplateCategory>>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    description: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TEnum<typeof TemplateStatus>;
    pieces: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    tags: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    flows: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        displayName: import("@sinclair/typebox").TString;
        valid: import("@sinclair/typebox").TBoolean;
        trigger: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.PIECE>;
            settings: import("@sinclair/typebox").TObject<{
                sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                    sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                    lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                }>>;
                propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
                    type: import("@sinclair/typebox").TEnum<typeof import("../flows").PropertyExecutionType>;
                    schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
                }>>;
                customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                pieceName: import("@sinclair/typebox").TString;
                pieceVersion: import("@sinclair/typebox").TString;
                triggerName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
                input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
            }>;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TLiteral<import("../..").FlowTriggerType.EMPTY>;
            settings: import("@sinclair/typebox").TAny;
            name: import("@sinclair/typebox").TString;
            valid: import("@sinclair/typebox").TBoolean;
            displayName: import("@sinclair/typebox").TString;
            nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>]>;
        schemaVersion: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    }>>>;
    summary: import("@sinclair/typebox").TString;
    blogUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    author: import("@sinclair/typebox").TString;
}>;
export type SharedTemplate = Static<typeof SharedTemplate>;
