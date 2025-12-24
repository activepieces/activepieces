import { Static } from '@sinclair/typebox';
export declare enum STATUS_VARIANT {
    POSITIVE = "Positive (Green)",
    NEGATIVE = "Negative (Red)",
    NEUTRAL = "Neutral (Gray)"
}
export declare const UNRESOLVED_STATUS: {
    name: string;
    description: string;
    variant: STATUS_VARIANT;
};
export declare const RESOLVED_STATUS: {
    name: string;
    description: string;
    variant: STATUS_VARIANT;
};
export declare const STATUS_COLORS: Record<STATUS_VARIANT, StatusColor>;
export type StatusColor = {
    color: string;
    textColor: string;
};
export declare const CreateAndWaitTodoResult: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
}>;
export type CreateAndWaitTodoResult = Static<typeof CreateAndWaitTodoResult>;
export declare const CreateTodoResult: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    links: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        url: import("@sinclair/typebox").TString;
    }>>;
}>;
export type CreateTodoResult = Static<typeof CreateTodoResult>;
export declare const StatusOption: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEUTRAL>]>;
    continueFlow: import("@sinclair/typebox").TBoolean;
}>;
export type StatusOption = Static<typeof StatusOption>;
export declare enum TodoEnvironment {
    TEST = "test",
    PRODUCTION = "production"
}
export declare const Todo: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>;
    createdByUserId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    statusOptions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>>;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TString;
    runId: import("@sinclair/typebox").TString;
    assigneeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    locked: import("@sinclair/typebox").TBoolean;
    resolveUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    environment: import("@sinclair/typebox").TEnum<typeof TodoEnvironment>;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type Todo = Static<typeof Todo>;
export declare const PopulatedTodo: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    status: import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>;
    flowId: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    title: import("@sinclair/typebox").TString;
    runId: import("@sinclair/typebox").TString;
    locked: import("@sinclair/typebox").TBoolean;
    environment: import("@sinclair/typebox").TEnum<typeof TodoEnvironment>;
    createdByUserId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    statusOptions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>>;
    assigneeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    resolveUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    flow: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        metadata?: {
            [x: string]: unknown;
        };
        folderId?: string;
        publishedVersionId?: string;
        timeSavedPerRun?: number;
        triggerSource?: {
            schedule?: {
                type: import("../trigger").TriggerSourceScheduleType.CRON_EXPRESSION;
                cronExpression: string;
                timezone: string;
            };
        };
        version: {
            updatedBy?: string;
            schemaVersion?: string;
            backupFiles?: {
                [x: string]: string;
            };
            flowId: string;
            id: string;
            created: string;
            updated: string;
            displayName: string;
            valid: boolean;
            trigger: {
                nextAction?: any;
                type: import("../..").FlowTriggerType.EMPTY;
                name: string;
                displayName: string;
                settings: any;
                valid: boolean;
            } | {
                nextAction?: any;
                type: import("../..").FlowTriggerType.PIECE;
                name: string;
                displayName: string;
                settings: {
                    sampleData?: {
                        sampleDataFileId?: string;
                        sampleDataInputFileId?: string;
                        lastTestDate?: string;
                    };
                    customLogoUrl?: string;
                    triggerName?: string;
                    pieceName: string;
                    pieceVersion: string;
                    input: {
                        [x: string]: any;
                    };
                    propertySettings: {
                        [x: string]: {
                            schema?: any;
                            type: import("../flows").PropertyExecutionType;
                        };
                    };
                };
                valid: boolean;
            };
            agentIds: string[];
            state: import("../..").FlowVersionState;
            connectionIds: string[];
        };
        projectId: string;
        id: string;
        created: string;
        updated: string;
        status: import("../flows").FlowStatus;
        externalId: string;
        operationStatus: import("../flows").FlowOperationStatus;
    }>>;
    assignee: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        externalId?: string;
        lastActiveDate?: string;
        id: string;
        created: string;
        updated: string;
        status: import("../user").UserStatus;
        email: string;
        platformRole: import("../user").PlatformRole;
        firstName: string;
        lastName: string;
    }>>;
    createdByUser: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        externalId?: string;
        lastActiveDate?: string;
        id: string;
        created: string;
        updated: string;
        status: import("../user").UserStatus;
        email: string;
        platformRole: import("../user").PlatformRole;
        firstName: string;
        lastName: string;
    }>>;
}>;
export type PopulatedTodo = Static<typeof PopulatedTodo>;
export declare enum TodoType {
    INTERNAL = "internal",
    EXTERNAL = "external"
}
export declare const TodoActivity: import("@sinclair/typebox").TObject<{
    todoId: import("@sinclair/typebox").TString;
    userId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    content: import("@sinclair/typebox").TString;
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
}>;
export type TodoActivity = Static<typeof TodoActivity>;
export declare const TodoActivityWithUser: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    created: import("@sinclair/typebox").TString;
    updated: import("@sinclair/typebox").TString;
    todoId: import("@sinclair/typebox").TString;
    content: import("@sinclair/typebox").TString;
    userId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
    user: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<{
        platformId?: string;
        externalId?: string;
        lastActiveDate?: string;
        id: string;
        created: string;
        updated: string;
        status: import("../user").UserStatus;
        email: string;
        platformRole: import("../user").PlatformRole;
        firstName: string;
        lastName: string;
    }>>;
}>;
export type TodoActivityWithUser = Static<typeof TodoActivityWithUser>;
