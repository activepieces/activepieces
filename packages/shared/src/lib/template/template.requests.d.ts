import { Static } from '@sinclair/typebox';
import { TemplateCategory, TemplateStatus, TemplateType } from './template';
export declare const CreateTemplateRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    summary: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    blogUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    author: import("@sinclair/typebox").TString;
    categories: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TemplateCategory>>;
    type: import("@sinclair/typebox").TEnum<typeof TemplateType>;
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
}>;
export type CreateTemplateRequestBody = Static<typeof CreateTemplateRequestBody>;
export declare const UpdateFlowTemplateRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    blogUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TemplateStatus>>;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TemplateCategory>>>;
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
}>;
export type UpdateFlowTemplateRequestBody = Static<typeof UpdateFlowTemplateRequestBody>;
export declare const UpdateTemplateRequestBody: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    blogUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    metadata: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        [x: string]: unknown;
    }>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TemplateStatus>>;
    categories: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TEnum<typeof TemplateCategory>>>;
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
}>;
export type UpdateTemplateRequestBody = Static<typeof UpdateTemplateRequestBody>;
export declare const ListFlowTemplatesRequestQuery: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TemplateType>>;
    pieces: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ListFlowTemplatesRequestQuery = Static<typeof ListFlowTemplatesRequestQuery>;
export declare const ListTemplatesRequestQuery: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TemplateType>>;
    pieces: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    tags: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        color: import("@sinclair/typebox").TString;
        icon: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    search: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type ListTemplatesRequestQuery = Static<typeof ListTemplatesRequestQuery>;
