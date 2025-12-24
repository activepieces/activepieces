"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoopStepOutput = exports.RouterStepOutput = exports.GenericStepOutput = exports.StepOutputStatus = void 0;
const common_1 = require("../../common");
const action_1 = require("../../flows/actions/action");
var StepOutputStatus;
(function (StepOutputStatus) {
    StepOutputStatus["FAILED"] = "FAILED";
    StepOutputStatus["PAUSED"] = "PAUSED";
    StepOutputStatus["RUNNING"] = "RUNNING";
    StepOutputStatus["STOPPED"] = "STOPPED";
    StepOutputStatus["SUCCEEDED"] = "SUCCEEDED";
})(StepOutputStatus || (exports.StepOutputStatus = StepOutputStatus = {}));
class GenericStepOutput {
    constructor(step) {
        this.type = step.type;
        this.status = step.status;
        this.input = step.input;
        this.output = step.output;
        this.duration = step.duration;
        this.errorMessage = step.errorMessage;
    }
    setOutput(output) {
        return new GenericStepOutput(Object.assign(Object.assign({}, this), { output }));
    }
    setStatus(status) {
        return new GenericStepOutput(Object.assign(Object.assign({}, this), { status }));
    }
    setErrorMessage(errorMessage) {
        return new GenericStepOutput(Object.assign(Object.assign({}, this), { errorMessage }));
    }
    setDuration(duration) {
        return new GenericStepOutput(Object.assign(Object.assign({}, this), { duration }));
    }
    static create({ input, type, status, output, }) {
        return new GenericStepOutput({
            input,
            type,
            status,
            output,
        });
    }
}
exports.GenericStepOutput = GenericStepOutput;
class RouterStepOutput extends GenericStepOutput {
    static init({ input }) {
        return new RouterStepOutput({
            type: action_1.FlowActionType.ROUTER,
            input,
            status: StepOutputStatus.SUCCEEDED,
        });
    }
}
exports.RouterStepOutput = RouterStepOutput;
class LoopStepOutput extends GenericStepOutput {
    constructor(step) {
        var _a;
        super(step);
        this.output = (_a = step.output) !== null && _a !== void 0 ? _a : {
            item: undefined,
            index: 0,
            iterations: [],
        };
    }
    static init({ input }) {
        return new LoopStepOutput({
            type: action_1.FlowActionType.LOOP_ON_ITEMS,
            input,
            status: StepOutputStatus.SUCCEEDED,
        });
    }
    setIterations(iterations) {
        return new LoopStepOutput(Object.assign(Object.assign({}, this), { output: Object.assign(Object.assign({}, this.output), { iterations }) }));
    }
    hasIteration(iteration) {
        var _a;
        return !(0, common_1.isNil)((_a = this.output) === null || _a === void 0 ? void 0 : _a.iterations[iteration]);
    }
    setItemAndIndex({ item, index, }) {
        var _a, _b;
        return new LoopStepOutput(Object.assign(Object.assign({}, this), { output: {
                item,
                index,
                iterations: (_b = (_a = this.output) === null || _a === void 0 ? void 0 : _a.iterations) !== null && _b !== void 0 ? _b : [],
            } }));
    }
    addIteration() {
        var _a, _b, _c, _d;
        return new LoopStepOutput(Object.assign(Object.assign({}, this), { output: {
                item: (_a = this.output) === null || _a === void 0 ? void 0 : _a.item,
                index: (_b = this.output) === null || _b === void 0 ? void 0 : _b.index,
                iterations: [...((_d = (_c = this.output) === null || _c === void 0 ? void 0 : _c.iterations) !== null && _d !== void 0 ? _d : []), {}],
            } }));
    }
}
exports.LoopStepOutput = LoopStepOutput;
//# sourceMappingURL=step-output.js.map