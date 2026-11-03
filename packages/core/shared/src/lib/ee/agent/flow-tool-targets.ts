import { isObject } from '@activepieces/core-utils'

function targetOf({ toolName, input }: { toolName: string, input: unknown }): FlowToolTarget | null {
    const rule = RULES[toolName]
    if (rule === undefined || !isObject(input)) {
        return null
    }
    if ('step' in rule) {
        return { kind: rule.kind, stepName: rule.step }
    }
    if (!('stepKey' in rule)) {
        return { kind: rule.kind }
    }
    const stepName = input[rule.stepKey]
    return typeof stepName === 'string' && stepName.length > 0 ? { kind: rule.kind, stepName } : null
}

const RULES: Record<string, TargetRule> = {
    ap_update_step: { kind: 'editing', stepKey: 'stepName' },
    ap_delete_step: { kind: 'removing', stepKey: 'stepName' },
    ap_update_trigger: { kind: 'editing', step: 'trigger' },
    ap_add_branch: { kind: 'editing', stepKey: 'routerStepName' },
    ap_update_branch: { kind: 'editing', stepKey: 'routerStepName' },
    ap_delete_branch: { kind: 'removing', stepKey: 'routerStepName' },
    ap_add_step: { kind: 'adding-after', stepKey: 'parentStepName' },
    ap_test_step: { kind: 'testing', stepKey: 'stepName' },
    ap_test_flow: { kind: 'testing-flow' },
    ap_read_step_settings: { kind: 'reading', stepKey: 'stepName' },
    ap_read_step_code: { kind: 'reading', stepKey: 'stepName' },
    ap_flow_structure: { kind: 'reading-flow' },
}

export const flowToolTargets = {
    targetOf,
}

type StepTargetKind = 'editing' | 'removing' | 'adding-after' | 'testing' | 'reading'

type FlowTargetKind = 'testing-flow' | 'reading-flow'

type TargetRule =
    | { kind: StepTargetKind, stepKey: string }
    | { kind: StepTargetKind, step: string }
    | { kind: FlowTargetKind }

export type FlowToolTarget =
    | { kind: StepTargetKind, stepName: string }
    | { kind: FlowTargetKind }
