"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopOnItemsStepOutput = exports.StepOutput = exports.StepOutputStatus = void 0;
var StepOutputStatus;
(function (StepOutputStatus) {
    StepOutputStatus["RUNNING"] = "RUNNING";
    StepOutputStatus["SUCCEEDED"] = "SUCCEEDED";
    StepOutputStatus["FAILED"] = "FAILED";
})(StepOutputStatus = exports.StepOutputStatus || (exports.StepOutputStatus = {}));
class StepOutput {
}
exports.StepOutput = StepOutput;
class LoopOnItemsStepOutput extends StepOutput {
}
exports.LoopOnItemsStepOutput = LoopOnItemsStepOutput;
