"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAction = exports.IAction = exports.ErrorHandlingOptionsParam = void 0;
const typebox_1 = require("@sinclair/typebox");
exports.ErrorHandlingOptionsParam = typebox_1.Type.Object({
    retryOnFailure: typebox_1.Type.Object({
        defaultValue: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
        hide: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    }),
    continueOnFailure: typebox_1.Type.Object({
        defaultValue: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
        hide: typebox_1.Type.Optional(typebox_1.Type.Boolean()),
    }),
});
class IAction {
    constructor(name, displayName, description, props, run, test, requireAuth, errorHandlingOptions) {
        this.name = name;
        this.displayName = displayName;
        this.description = description;
        this.props = props;
        this.run = run;
        this.test = test;
        this.requireAuth = requireAuth;
        this.errorHandlingOptions = errorHandlingOptions;
    }
}
exports.IAction = IAction;
const createAction = (params) => {
    var _a, _b, _c;
    return new IAction(params.name, params.displayName, params.description, params.props, params.run, (_a = params.test) !== null && _a !== void 0 ? _a : params.run, (_b = params.requireAuth) !== null && _b !== void 0 ? _b : true, (_c = params.errorHandlingOptions) !== null && _c !== void 0 ? _c : {
        continueOnFailure: {
            defaultValue: false,
        },
        retryOnFailure: {
            defaultValue: false,
        }
    });
};
exports.createAction = createAction;
//# sourceMappingURL=action.js.map