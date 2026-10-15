import { isObject } from '@activepieces/core-utils'

function targetOf({ toolName, input }: { toolName: string, input: unknown }): FlowToolTarget | null {
    const rule = RULES[toolName]
    if (rule === undefined || !isObject(input)) {
        return null
    }
    if (rule.kind === 'testing-flow') {
        return { kind: 'testing-flow' }
    }
    const stepName = 'step' in rule ? rule.step : input[rule.stepKey]
    return typeof stepName === 'string' && stepName.length > 0 ? { kind: rule.kind, stepName } : null
}

function reportsTestRun(toolName: string): boolean {
    const kind = RULES[toolName]?.kind
    return kind === 'testing' || kind === 'testing-flow'
}

const RULES: Record<string, TargetRule> = {
    ap_update_step: { kind: 'editing', stepKey: 'stepName' },
    ap_delete_step: { kind: 'editing', stepKey: 'stepName' },
    ap_update_trigger: { kind: 'editing', step: 'trigger' },
    ap_add_branch: { kind: 'editing', stepKey: 'routerStepName' },
    ap_update_branch: { kind: 'editing', stepKey: 'routerStepName' },
    ap_delete_branch: { kind: 'editing', stepKey: 'routerStepName' },
    ap_add_step: { kind: 'adding-after', stepKey: 'parentStepName' },
    ap_test_step: { kind: 'testing', stepKey: 'stepName' },
    ap_test_flow: { kind: 'testing-flow' },
}

export const flowToolTargets = {
    targetOf,
    reportsTestRun,
}

type StepTargetKind = 'editing' | 'adding-after' | 'testing'

type TargetRule =
    | { kind: StepTargetKind, stepKey: string }
    | { kind: StepTargetKind, step: string }
    | { kind: 'testing-flow' }

export type FlowToolTarget =
    | { kind: StepTargetKind, stepName: string }
    | { kind: 'testing-flow' }
