import { Static } from '@sinclair/typebox';
export declare enum FlowActionType {
    CODE = "CODE",
    PIECE = "PIECE",
    LOOP_ON_ITEMS = "LOOP_ON_ITEMS",
    ROUTER = "ROUTER"
}
export declare enum RouterExecutionType {
    EXECUTE_ALL_MATCH = "EXECUTE_ALL_MATCH",
    EXECUTE_FIRST_MATCH = "EXECUTE_FIRST_MATCH"
}
export declare enum BranchExecutionType {
    FALLBACK = "FALLBACK",
    CONDITION = "CONDITION"
}
export declare const ActionErrorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
    continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>>;
    retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>>;
}>>;
export type ActionErrorHandlingOptions = Static<typeof ActionErrorHandlingOptions>;
export declare const SourceCode: import("@sinclair/typebox").TObject<{
    packageJson: import("@sinclair/typebox").TString;
    code: import("@sinclair/typebox").TString;
}>;
export type SourceCode = Static<typeof SourceCode>;
export declare const CodeActionSettings: import("@sinclair/typebox").TObject<{
    sourceCode: import("@sinclair/typebox").TObject<{
        packageJson: import("@sinclair/typebox").TString;
        code: import("@sinclair/typebox").TString;
    }>;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
    errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>>;
        retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>>;
    }>>;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type CodeActionSettings = Static<typeof CodeActionSettings>;
export declare const CodeActionSchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.CODE>;
    settings: import("@sinclair/typebox").TObject<{
        sourceCode: import("@sinclair/typebox").TObject<{
            packageJson: import("@sinclair/typebox").TString;
            code: import("@sinclair/typebox").TString;
        }>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const PieceActionSettings: import("@sinclair/typebox").TObject<{
    propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
        schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
    }>>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
    errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>>;
        retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        }>>;
    }>>;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type PieceActionSettings = Static<typeof PieceActionSettings>;
export declare const PieceActionSchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const LoopOnItemsActionSettings: import("@sinclair/typebox").TObject<{
    items: import("@sinclair/typebox").TString;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type LoopOnItemsActionSettings = Static<typeof LoopOnItemsActionSettings>;
export declare const LoopOnItemsActionSchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.LOOP_ON_ITEMS>;
    settings: import("@sinclair/typebox").TObject<{
        items: import("@sinclair/typebox").TString;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare enum BranchOperator {
    TEXT_CONTAINS = "TEXT_CONTAINS",
    TEXT_DOES_NOT_CONTAIN = "TEXT_DOES_NOT_CONTAIN",
    TEXT_EXACTLY_MATCHES = "TEXT_EXACTLY_MATCHES",
    TEXT_DOES_NOT_EXACTLY_MATCH = "TEXT_DOES_NOT_EXACTLY_MATCH",
    TEXT_STARTS_WITH = "TEXT_START_WITH",
    TEXT_DOES_NOT_START_WITH = "TEXT_DOES_NOT_START_WITH",
    TEXT_ENDS_WITH = "TEXT_ENDS_WITH",
    TEXT_DOES_NOT_END_WITH = "TEXT_DOES_NOT_END_WITH",
    NUMBER_IS_GREATER_THAN = "NUMBER_IS_GREATER_THAN",
    NUMBER_IS_LESS_THAN = "NUMBER_IS_LESS_THAN",
    NUMBER_IS_EQUAL_TO = "NUMBER_IS_EQUAL_TO",
    BOOLEAN_IS_TRUE = "BOOLEAN_IS_TRUE",
    BOOLEAN_IS_FALSE = "BOOLEAN_IS_FALSE",
    DATE_IS_BEFORE = "DATE_IS_BEFORE",
    DATE_IS_EQUAL = "DATE_IS_EQUAL",
    DATE_IS_AFTER = "DATE_IS_AFTER",
    LIST_CONTAINS = "LIST_CONTAINS",
    LIST_DOES_NOT_CONTAIN = "LIST_DOES_NOT_CONTAIN",
    LIST_IS_EMPTY = "LIST_IS_EMPTY",
    LIST_IS_NOT_EMPTY = "LIST_IS_NOT_EMPTY",
    EXISTS = "EXISTS",
    DOES_NOT_EXIST = "DOES_NOT_EXIST"
}
export declare const singleValueConditions: BranchOperator[];
export declare const textConditions: BranchOperator[];
export declare const ValidBranchCondition: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
}>]>;
export type ValidBranchCondition = Static<typeof ValidBranchCondition>;
export declare const BranchCondition: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
}>, import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
}>]>;
export type BranchCondition = Static<typeof BranchCondition>;
export declare const BranchTextCondition: import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
}>;
export type BranchTextCondition = Static<typeof BranchTextCondition>;
export declare const BranchNumberCondition: import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
}>;
export type BranchNumberCondition = Static<typeof BranchNumberCondition>;
export declare const BranchDateCondition: import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    secondValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
}>;
export type BranchDateCondition = Static<typeof BranchDateCondition>;
export declare const BranchSingleValueCondition: import("@sinclair/typebox").TObject<{
    firstValue: import("@sinclair/typebox").TString;
    operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
}>;
export type BranchSingleValueCondition = Static<typeof BranchSingleValueCondition>;
export declare const RouterBranchesSchema: (addMinLength: boolean) => import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        secondValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
    }>, import("@sinclair/typebox").TObject<{
        firstValue: import("@sinclair/typebox").TString;
        operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
    }>]>>>;
    branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
    branchName: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
    branchName: import("@sinclair/typebox").TString;
}>]>>;
export declare const RouterActionSettings: import("@sinclair/typebox").TObject<{
    branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
        }>]>>>;
        branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
        branchName: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
        branchName: import("@sinclair/typebox").TString;
    }>]>>;
    executionType: import("@sinclair/typebox").TEnum<typeof RouterExecutionType>;
    sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const RouterActionSettingsWithValidation: import("@sinclair/typebox").TObject<{
    branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
        conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            secondValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
        }>, import("@sinclair/typebox").TObject<{
            firstValue: import("@sinclair/typebox").TString;
            operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
        }>]>>>;
        branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
        branchName: import("@sinclair/typebox").TString;
    }>, import("@sinclair/typebox").TObject<{
        branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
        branchName: import("@sinclair/typebox").TString;
    }>]>>;
    executionType: import("@sinclair/typebox").TEnum<typeof RouterExecutionType>;
}>;
export type RouterActionSettings = Static<typeof RouterActionSettings>;
export declare const FlowAction: import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.CODE>;
    settings: import("@sinclair/typebox").TObject<{
        sourceCode: import("@sinclair/typebox").TObject<{
            packageJson: import("@sinclair/typebox").TString;
            code: import("@sinclair/typebox").TString;
        }>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TThis>;
}>]>, import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TThis>;
}>]>, import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.LOOP_ON_ITEMS>;
    settings: import("@sinclair/typebox").TObject<{
        items: import("@sinclair/typebox").TString;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TThis>;
    firstLoopAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TThis>;
}>]>, import("@sinclair/typebox").TIntersect<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.ROUTER>;
    settings: import("@sinclair/typebox").TObject<{
        branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
            }>]>>>;
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
            branchName: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
            branchName: import("@sinclair/typebox").TString;
        }>]>>;
        executionType: import("@sinclair/typebox").TEnum<typeof RouterExecutionType>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    nextAction: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TThis>;
    children: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TThis, import("@sinclair/typebox").TNull]>>;
}>]>]>>;
export declare const RouterActionSchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.ROUTER>;
    settings: import("@sinclair/typebox").TObject<{
        branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
            }>]>>>;
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
            branchName: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
            branchName: import("@sinclair/typebox").TString;
        }>]>>;
        executionType: import("@sinclair/typebox").TEnum<typeof RouterExecutionType>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const SingleActionSchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.CODE>;
    settings: import("@sinclair/typebox").TObject<{
        sourceCode: import("@sinclair/typebox").TObject<{
            packageJson: import("@sinclair/typebox").TString;
            code: import("@sinclair/typebox").TString;
        }>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TAny>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.PIECE>;
    settings: import("@sinclair/typebox").TObject<{
        propertySettings: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
            type: import("@sinclair/typebox").TEnum<typeof import("../properties").PropertyExecutionType>;
            schema: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TAny>;
        }>>;
        pieceName: import("@sinclair/typebox").TString;
        pieceVersion: import("@sinclair/typebox").TString;
        actionName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        input: import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>;
        errorHandlingOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            continueOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
            retryOnFailure: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
                value: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
            }>>;
        }>>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.LOOP_ON_ITEMS>;
    settings: import("@sinclair/typebox").TObject<{
        items: import("@sinclair/typebox").TString;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>, import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TLiteral<FlowActionType.ROUTER>;
    settings: import("@sinclair/typebox").TObject<{
        branches: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
            conditions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                caseSensitive: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_CONTAIN> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_EXACTLY_MATCHES> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_STARTS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_START_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_ENDS_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.TEXT_DOES_NOT_END_WITH> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_CONTAINS> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_DOES_NOT_CONTAIN>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_GREATER_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_LESS_THAN> | import("@sinclair/typebox").TLiteral<BranchOperator.NUMBER_IS_EQUAL_TO>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                secondValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_BEFORE> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_EQUAL> | import("@sinclair/typebox").TLiteral<BranchOperator.DATE_IS_AFTER>)[]>>;
            }>, import("@sinclair/typebox").TObject<{
                firstValue: import("@sinclair/typebox").TString;
                operator: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<(import("@sinclair/typebox").TLiteral<BranchOperator.EXISTS> | import("@sinclair/typebox").TLiteral<BranchOperator.DOES_NOT_EXIST> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_TRUE> | import("@sinclair/typebox").TLiteral<BranchOperator.BOOLEAN_IS_FALSE> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_EMPTY> | import("@sinclair/typebox").TLiteral<BranchOperator.LIST_IS_NOT_EMPTY>)[]>>;
            }>]>>>;
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.CONDITION>;
            branchName: import("@sinclair/typebox").TString;
        }>, import("@sinclair/typebox").TObject<{
            branchType: import("@sinclair/typebox").TLiteral<BranchExecutionType.FALLBACK>;
            branchName: import("@sinclair/typebox").TString;
        }>]>>;
        executionType: import("@sinclair/typebox").TEnum<typeof RouterExecutionType>;
        sampleData: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            sampleDataFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sampleDataInputFileId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            lastTestDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        customLogoUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>;
    name: import("@sinclair/typebox").TString;
    valid: import("@sinclair/typebox").TBoolean;
    displayName: import("@sinclair/typebox").TString;
    skip: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>]>;
export type FlowAction = Static<typeof FlowAction>;
export type RouterAction = Static<typeof RouterActionSchema> & {
    nextAction?: FlowAction;
    children: (FlowAction | null)[];
};
export type LoopOnItemsAction = Static<typeof LoopOnItemsActionSchema> & {
    nextAction?: FlowAction;
    firstLoopAction?: FlowAction;
};
export type PieceAction = Static<typeof PieceActionSchema> & {
    nextAction?: FlowAction;
};
export type CodeAction = Static<typeof CodeActionSchema> & {
    nextAction?: FlowAction;
};
export declare const emptyCondition: ValidBranchCondition;
