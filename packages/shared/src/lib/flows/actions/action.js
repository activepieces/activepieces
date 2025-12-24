"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyCondition = exports.SingleActionSchema = exports.RouterActionSchema = exports.FlowAction = exports.RouterActionSettingsWithValidation = exports.RouterActionSettings = exports.RouterBranchesSchema = exports.BranchSingleValueCondition = exports.BranchDateCondition = exports.BranchNumberCondition = exports.BranchTextCondition = exports.BranchCondition = exports.ValidBranchCondition = exports.textConditions = exports.singleValueConditions = exports.BranchOperator = exports.LoopOnItemsActionSchema = exports.LoopOnItemsActionSettings = exports.PieceActionSchema = exports.PieceActionSettings = exports.CodeActionSchema = exports.CodeActionSettings = exports.SourceCode = exports.ActionErrorHandlingOptions = exports.BranchExecutionType = exports.RouterExecutionType = exports.FlowActionType = void 0;
const typebox_1 = require("@sinclair/typebox");
const pieces_1 = require("../../pieces");
const properties_1 = require("../properties");
const sample_data_1 = require("../sample-data");
var FlowActionType;
(function (FlowActionType) {
    FlowActionType["CODE"] = "CODE";
    FlowActionType["PIECE"] = "PIECE";
    FlowActionType["LOOP_ON_ITEMS"] = "LOOP_ON_ITEMS";
    FlowActionType["ROUTER"] = "ROUTER";
})(FlowActionType || (exports.FlowActionType = FlowActionType = {}));
var RouterExecutionType;
(function (RouterExecutionType) {
    RouterExecutionType["EXECUTE_ALL_MATCH"] = "EXECUTE_ALL_MATCH";
    RouterExecutionType["EXECUTE_FIRST_MATCH"] = "EXECUTE_FIRST_MATCH";
})(RouterExecutionType || (exports.RouterExecutionType = RouterExecutionType = {}));
var BranchExecutionType;
(function (BranchExecutionType) {
    BranchExecutionType["FALLBACK"] = "FALLBACK";
    BranchExecutionType["CONDITION"] = "CONDITION";
})(BranchExecutionType || (exports.BranchExecutionType = BranchExecutionType = {}));
const commonActionProps = {
    name: typebox_1.Type.String({}),
    valid: typebox_1.Type.Boolean({}),
    displayName: typebox_1.Type.String({}),
    skip: typebox_1.Type.Optional(typebox_1.Type.Boolean({})),
};
const commonActionSettings = {
    sampleData: typebox_1.Type.Optional(sample_data_1.SampleDataSetting),
    customLogoUrl: typebox_1.Type.Optional(typebox_1.Type.String()),
};
exports.ActionErrorHandlingOptions = typebox_1.Type.Optional(typebox_1.Type.Object({
    continueOnFailure: typebox_1.Type.Optional(typebox_1.Type.Object({
        value: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    })),
    retryOnFailure: typebox_1.Type.Optional(typebox_1.Type.Object({
        value: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    })),
}));
exports.SourceCode = typebox_1.Type.Object({
    packageJson: typebox_1.Type.String({}),
    code: typebox_1.Type.String({}),
});
exports.CodeActionSettings = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionSettings), { sourceCode: exports.SourceCode, input: typebox_1.Type.Record(typebox_1.Type.String({}), typebox_1.Type.Any()), errorHandlingOptions: exports.ActionErrorHandlingOptions }));
exports.CodeActionSchema = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionProps), { type: typebox_1.Type.Literal(FlowActionType.CODE), settings: exports.CodeActionSettings }));
exports.PieceActionSettings = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionSettings), { propertySettings: typebox_1.Type.Record(typebox_1.Type.String(), properties_1.PropertySettings), pieceName: typebox_1.Type.String({}), pieceVersion: pieces_1.VersionType, actionName: typebox_1.Type.Optional(typebox_1.Type.String({})), input: typebox_1.Type.Record(typebox_1.Type.String({}), typebox_1.Type.Unknown()), errorHandlingOptions: exports.ActionErrorHandlingOptions }));
exports.PieceActionSchema = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionProps), { type: typebox_1.Type.Literal(FlowActionType.PIECE), settings: exports.PieceActionSettings }));
// Loop Items
exports.LoopOnItemsActionSettings = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionSettings), { items: typebox_1.Type.String() }));
exports.LoopOnItemsActionSchema = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionProps), { type: typebox_1.Type.Literal(FlowActionType.LOOP_ON_ITEMS), settings: exports.LoopOnItemsActionSettings }));
var BranchOperator;
(function (BranchOperator) {
    BranchOperator["TEXT_CONTAINS"] = "TEXT_CONTAINS";
    BranchOperator["TEXT_DOES_NOT_CONTAIN"] = "TEXT_DOES_NOT_CONTAIN";
    BranchOperator["TEXT_EXACTLY_MATCHES"] = "TEXT_EXACTLY_MATCHES";
    BranchOperator["TEXT_DOES_NOT_EXACTLY_MATCH"] = "TEXT_DOES_NOT_EXACTLY_MATCH";
    BranchOperator["TEXT_STARTS_WITH"] = "TEXT_START_WITH";
    BranchOperator["TEXT_DOES_NOT_START_WITH"] = "TEXT_DOES_NOT_START_WITH";
    BranchOperator["TEXT_ENDS_WITH"] = "TEXT_ENDS_WITH";
    BranchOperator["TEXT_DOES_NOT_END_WITH"] = "TEXT_DOES_NOT_END_WITH";
    BranchOperator["NUMBER_IS_GREATER_THAN"] = "NUMBER_IS_GREATER_THAN";
    BranchOperator["NUMBER_IS_LESS_THAN"] = "NUMBER_IS_LESS_THAN";
    BranchOperator["NUMBER_IS_EQUAL_TO"] = "NUMBER_IS_EQUAL_TO";
    BranchOperator["BOOLEAN_IS_TRUE"] = "BOOLEAN_IS_TRUE";
    BranchOperator["BOOLEAN_IS_FALSE"] = "BOOLEAN_IS_FALSE";
    BranchOperator["DATE_IS_BEFORE"] = "DATE_IS_BEFORE";
    BranchOperator["DATE_IS_EQUAL"] = "DATE_IS_EQUAL";
    BranchOperator["DATE_IS_AFTER"] = "DATE_IS_AFTER";
    BranchOperator["LIST_CONTAINS"] = "LIST_CONTAINS";
    BranchOperator["LIST_DOES_NOT_CONTAIN"] = "LIST_DOES_NOT_CONTAIN";
    BranchOperator["LIST_IS_EMPTY"] = "LIST_IS_EMPTY";
    BranchOperator["LIST_IS_NOT_EMPTY"] = "LIST_IS_NOT_EMPTY";
    BranchOperator["EXISTS"] = "EXISTS";
    BranchOperator["DOES_NOT_EXIST"] = "DOES_NOT_EXIST";
})(BranchOperator || (exports.BranchOperator = BranchOperator = {}));
exports.singleValueConditions = [
    BranchOperator.EXISTS,
    BranchOperator.DOES_NOT_EXIST,
    BranchOperator.BOOLEAN_IS_TRUE,
    BranchOperator.BOOLEAN_IS_FALSE,
    BranchOperator.LIST_IS_EMPTY,
    BranchOperator.LIST_IS_NOT_EMPTY,
];
exports.textConditions = [
    BranchOperator.TEXT_CONTAINS,
    BranchOperator.TEXT_DOES_NOT_CONTAIN,
    BranchOperator.TEXT_EXACTLY_MATCHES,
    BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH,
    BranchOperator.TEXT_STARTS_WITH,
    BranchOperator.TEXT_DOES_NOT_START_WITH,
    BranchOperator.TEXT_ENDS_WITH,
    BranchOperator.TEXT_DOES_NOT_END_WITH,
    BranchOperator.LIST_CONTAINS,
    BranchOperator.LIST_DOES_NOT_CONTAIN,
];
const BranchOperatorTextLiterals = [
    typebox_1.Type.Literal(BranchOperator.TEXT_CONTAINS),
    typebox_1.Type.Literal(BranchOperator.TEXT_DOES_NOT_CONTAIN),
    typebox_1.Type.Literal(BranchOperator.TEXT_EXACTLY_MATCHES),
    typebox_1.Type.Literal(BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH),
    typebox_1.Type.Literal(BranchOperator.TEXT_STARTS_WITH),
    typebox_1.Type.Literal(BranchOperator.TEXT_DOES_NOT_START_WITH),
    typebox_1.Type.Literal(BranchOperator.TEXT_ENDS_WITH),
    typebox_1.Type.Literal(BranchOperator.TEXT_DOES_NOT_END_WITH),
    typebox_1.Type.Literal(BranchOperator.LIST_CONTAINS),
    typebox_1.Type.Literal(BranchOperator.LIST_DOES_NOT_CONTAIN),
];
const BranchOperatorNumberLiterals = [
    typebox_1.Type.Literal(BranchOperator.NUMBER_IS_GREATER_THAN),
    typebox_1.Type.Literal(BranchOperator.NUMBER_IS_LESS_THAN),
    typebox_1.Type.Literal(BranchOperator.NUMBER_IS_EQUAL_TO),
];
const BranchOperatorDateLiterals = [
    typebox_1.Type.Literal(BranchOperator.DATE_IS_BEFORE),
    typebox_1.Type.Literal(BranchOperator.DATE_IS_EQUAL),
    typebox_1.Type.Literal(BranchOperator.DATE_IS_AFTER),
];
const BranchOperatorSingleValueLiterals = [
    typebox_1.Type.Literal(BranchOperator.EXISTS),
    typebox_1.Type.Literal(BranchOperator.DOES_NOT_EXIST),
    typebox_1.Type.Literal(BranchOperator.BOOLEAN_IS_TRUE),
    typebox_1.Type.Literal(BranchOperator.BOOLEAN_IS_FALSE),
    typebox_1.Type.Literal(BranchOperator.LIST_IS_EMPTY),
    typebox_1.Type.Literal(BranchOperator.LIST_IS_NOT_EMPTY),
];
const BranchTextConditionValid = (addMinLength) => typebox_1.Type.Object({
    firstValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    secondValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    caseSensitive: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    operator: typebox_1.Type.Optional(typebox_1.Type.Union(BranchOperatorTextLiterals)),
});
const BranchNumberConditionValid = (addMinLength) => typebox_1.Type.Object({
    firstValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    secondValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    operator: typebox_1.Type.Optional(typebox_1.Type.Union(BranchOperatorNumberLiterals)),
});
const BranchDateConditionValid = (addMinLength) => typebox_1.Type.Object({
    firstValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    secondValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    operator: typebox_1.Type.Optional(typebox_1.Type.Union(BranchOperatorDateLiterals)),
});
const BranchSingleValueConditionValid = (addMinLength) => typebox_1.Type.Object({
    firstValue: typebox_1.Type.String(addMinLength ? { minLength: 1 } : {}),
    operator: typebox_1.Type.Optional(typebox_1.Type.Union(BranchOperatorSingleValueLiterals)),
});
const BranchConditionValid = (addMinLength) => typebox_1.Type.Union([
    BranchTextConditionValid(addMinLength),
    BranchNumberConditionValid(addMinLength),
    BranchDateConditionValid(addMinLength),
    BranchSingleValueConditionValid(addMinLength),
]);
exports.ValidBranchCondition = BranchConditionValid(true);
// TODO remove this and use ValidBranchCondition everywhere
exports.BranchCondition = BranchConditionValid(false);
exports.BranchTextCondition = BranchTextConditionValid(false);
exports.BranchNumberCondition = BranchNumberConditionValid(false);
exports.BranchDateCondition = BranchDateConditionValid(false);
exports.BranchSingleValueCondition = BranchSingleValueConditionValid(false);
const RouterBranchesSchema = (addMinLength) => typebox_1.Type.Array(typebox_1.Type.Union([
    typebox_1.Type.Object({
        conditions: typebox_1.Type.Array(typebox_1.Type.Array(BranchConditionValid(addMinLength))),
        branchType: typebox_1.Type.Literal(BranchExecutionType.CONDITION),
        branchName: typebox_1.Type.String(),
    }),
    typebox_1.Type.Object({
        branchType: typebox_1.Type.Literal(BranchExecutionType.FALLBACK),
        branchName: typebox_1.Type.String(),
    }),
]));
exports.RouterBranchesSchema = RouterBranchesSchema;
exports.RouterActionSettings = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionSettings), { branches: (0, exports.RouterBranchesSchema)(false), executionType: typebox_1.Type.Enum(RouterExecutionType) }));
exports.RouterActionSettingsWithValidation = typebox_1.Type.Object({
    branches: (0, exports.RouterBranchesSchema)(true),
    executionType: typebox_1.Type.Enum(RouterExecutionType),
});
// Union of all actions
exports.FlowAction = typebox_1.Type.Recursive((action) => typebox_1.Type.Union([
    typebox_1.Type.Intersect([
        exports.CodeActionSchema,
        typebox_1.Type.Object({
            nextAction: typebox_1.Type.Optional(action),
        }),
    ]),
    typebox_1.Type.Intersect([
        exports.PieceActionSchema,
        typebox_1.Type.Object({
            nextAction: typebox_1.Type.Optional(action),
        }),
    ]),
    typebox_1.Type.Intersect([
        exports.LoopOnItemsActionSchema,
        typebox_1.Type.Object({
            nextAction: typebox_1.Type.Optional(action),
            firstLoopAction: typebox_1.Type.Optional(action),
        }),
    ]),
    typebox_1.Type.Intersect([
        typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionProps), { type: typebox_1.Type.Literal(FlowActionType.ROUTER), settings: exports.RouterActionSettings })),
        typebox_1.Type.Object({
            nextAction: typebox_1.Type.Optional(action),
            children: typebox_1.Type.Array(typebox_1.Type.Union([action, typebox_1.Type.Null()])),
        }),
    ]),
]));
exports.RouterActionSchema = typebox_1.Type.Object(Object.assign(Object.assign({}, commonActionProps), { type: typebox_1.Type.Literal(FlowActionType.ROUTER), settings: exports.RouterActionSettings }));
exports.SingleActionSchema = typebox_1.Type.Union([
    exports.CodeActionSchema,
    exports.PieceActionSchema,
    exports.LoopOnItemsActionSchema,
    exports.RouterActionSchema,
]);
exports.emptyCondition = {
    firstValue: '',
    secondValue: '',
    operator: BranchOperator.TEXT_CONTAINS,
    caseSensitive: false,
};
//# sourceMappingURL=action.js.map