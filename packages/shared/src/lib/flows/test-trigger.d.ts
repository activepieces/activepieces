import { Static } from '@sinclair/typebox';
export declare enum TriggerTestStrategy {
    SIMULATION = "SIMULATION",
    TEST_FUNCTION = "TEST_FUNCTION"
}
export declare const TestTriggerRequestBody: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
    flowVersionId: import("@sinclair/typebox").TString;
    testStrategy: import("@sinclair/typebox").TEnum<typeof TriggerTestStrategy>;
}>;
export type TestTriggerRequestBody = Static<typeof TestTriggerRequestBody>;
export declare const CancelTestTriggerRequestBody: import("@sinclair/typebox").TObject<{
    flowId: import("@sinclair/typebox").TString;
}>;
export type CancelTestTriggerRequestBody = Static<typeof CancelTestTriggerRequestBody>;
