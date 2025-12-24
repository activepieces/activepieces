"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionMode = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./engine-operation"), exports);
tslib_1.__exportStar(require("./requests"), exports);
tslib_1.__exportStar(require("./engine-constants"), exports);
tslib_1.__exportStar(require("./execution-errors"), exports);
var ExecutionMode;
(function (ExecutionMode) {
    ExecutionMode["SANDBOX_PROCESS"] = "SANDBOX_PROCESS";
    ExecutionMode["SANDBOX_CODE_ONLY"] = "SANDBOX_CODE_ONLY";
    ExecutionMode["UNSANDBOXED"] = "UNSANDBOXED";
    ExecutionMode["SANDBOX_CODE_AND_PROCESS"] = "SANDBOX_CODE_AND_PROCESS";
})(ExecutionMode || (exports.ExecutionMode = ExecutionMode = {}));
//# sourceMappingURL=index.js.map