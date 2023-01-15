"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionState = void 0;
const step_output_1 = require("./step-output");
class ExecutionState {
    constructor() {
        this.configs = {};
        this.steps = {};
        this.lastStepState = {};
    }
    insertConfigs(configs) {
        if (configs instanceof Map) {
            configs.forEach((value, key) => {
                this.configs[key] = value;
            });
        }
        else if (typeof configs === 'object' && !Array.isArray(configs)) {
            Object.entries(configs).forEach(([key, value]) => {
                this.configs[key] = value;
            });
        }
        else {
            throw Error(`Invalid configs type: ${typeof configs}`);
        }
    }
    insertStep(stepOutput, actionName, ancestors) {
        const targetMap = this.getTargetMap(ancestors);
        targetMap[actionName] = stepOutput;
        this.updateLastStep(stepOutput.output, actionName);
    }
    updateLastStep(outputOnly, actionName) {
        this.lastStepState[actionName] = ExecutionState.deepClone(outputOnly);
    }
    static deepClone(value) {
        if (value === undefined) {
            return undefined;
        }
        if (value === null) {
            return null;
        }
        return JSON.parse(JSON.stringify(value));
    }
    getTargetMap(ancestors) {
        let targetMap = this.steps;
        ancestors.forEach(parent => {
            // get loopStepOutput
            if (targetMap[parent[0]] === undefined) {
                throw 'Error in ancestor tree';
            }
            const targetStepOutput = targetMap[parent[0]];
            if (!(targetStepOutput instanceof step_output_1.LoopOnItemsStepOutput)) {
                throw 'Error in ancestor tree, Not instance of Loop On Items step output';
            }
            const loopOutput = targetStepOutput;
            targetMap = loopOutput.output.iterations[parent[1]];
        });
        return targetMap;
    }
}
exports.ExecutionState = ExecutionState;
