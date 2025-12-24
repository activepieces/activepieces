import { Static } from '@sinclair/typebox';
import { TodoEnvironment } from '.';
export declare const ListTodosQueryParams: import("@sinclair/typebox").TObject<{
    platformId: import("@sinclair/typebox").TString;
    projectId: import("@sinclair/typebox").TString;
    flowId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
    assigneeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    statusOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    title: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    environment: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TodoEnvironment>>;
}>;
export type ListTodosQueryParams = Static<typeof ListTodosQueryParams>;
export declare const ListTodoAssigneesRequestQuery: import("@sinclair/typebox").TObject<{}>;
export type ListTodoAssigneesRequestQuery = Static<typeof ListTodoAssigneesRequestQuery>;
export declare const UpdateTodoRequestBody: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>>;
    statusOptions: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>>>;
    assigneeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    isTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export type UpdateTodoRequestBody = Static<typeof UpdateTodoRequestBody>;
export declare const CreateTodoRequestBody: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    statusOptions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnsafe<string>>;
        variant: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.POSITIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEGATIVE>, import("@sinclair/typebox").TLiteral<import(".").STATUS_VARIANT.NEUTRAL>]>;
        continueFlow: import("@sinclair/typebox").TBoolean;
    }>>;
    flowId: import("@sinclair/typebox").TString;
    runId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    assigneeId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    resolveUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    environment: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TEnum<typeof TodoEnvironment>>;
}>;
export type CreateTodoRequestBody = Static<typeof CreateTodoRequestBody>;
export declare const ResolveTodoRequestQuery: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TString;
    isTest: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export type ResolveTodoRequestQuery = Static<typeof ResolveTodoRequestQuery>;
export declare const ListTodoActivitiesQueryParams: import("@sinclair/typebox").TObject<{
    todoId: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    cursor: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TInteger>;
}>;
export type ListTodoActivitiesQueryParams = Static<typeof ListTodoActivitiesQueryParams>;
export declare const CreateTodoActivityRequestBody: import("@sinclair/typebox").TObject<{
    todoId: import("@sinclair/typebox").TString;
    content: import("@sinclair/typebox").TString;
}>;
export type CreateTodoActivityRequestBody = Static<typeof CreateTodoActivityRequestBody>;
