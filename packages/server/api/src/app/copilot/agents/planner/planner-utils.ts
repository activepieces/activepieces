import { Action, ActionType, assertNotNullOrUndefined, CopilotFlowOutline, CopilotStepPlan, ImportFlowRequest, PackageType, PieceType, Trigger, TriggerType, RouterExecutionType, BranchExecutionType, LATEST_SCHEMA_VERSION } from "@activepieces/shared"
import { nanoid } from "nanoid";

export const plannerUtils = {
    buildWorkflow: (plan: CopilotFlowOutline): ImportFlowRequest => {
        assertNotNullOrUndefined(plan, 'Workflow is required')

        const trigger: Trigger = {
            ...buildTrigger(plan),
            nextAction: buildActionsRecursively(plan.steps),
        };
        return {
            displayName: plan.name,
            trigger,
            schemaVersion: LATEST_SCHEMA_VERSION,
        }
    }
}

function buildTrigger(plan: CopilotFlowOutline): Trigger {
    return {
        name: 'trigger',
        type: TriggerType.PIECE,
        displayName: plan.trigger.title,
        settings: {
            triggerName: 'catch_webhook',
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.1.10',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
            input: {},
            inputUiInfo: {},
        },
        valid: true,
    }
}

function buildActionsRecursively(steps: CopilotStepPlan[], index = 0): Action | undefined {
    if (index >= steps.length) {
        return undefined;
    }
    switch (steps[index].type) {
        case 'action':
            return {
                name: `step_${nanoid()}`,
                type: ActionType.CODE,
                displayName: steps[index].title,
                settings: {
                    input: {},
                    inputUiInfo: {},
                    sourceCode: {
                        code: `export const code = async (inputs) => { return true; };`,
                        packageJson: '{}',
                    },
                },
                valid: true,
                nextAction: buildActionsRecursively(steps, index + 1)
            }
        case 'router': {
            const children = steps[index].branches.map(branch => buildActionsRecursively(branch.steps, 0) ?? null);
            const branches = steps[index].branches.map(branch => ({
                branchName: branch.condition,
                branchType: BranchExecutionType.CONDITION,
                conditions: [],
            }));
            branches.push({
                branchName: 'Otherwise',
                branchType: BranchExecutionType.FALLBACK,
                conditions: [],
            })
            children.push(null);

            return {
                name: `step_${index}`,
                type: ActionType.ROUTER,
                displayName: steps[index].title,
                settings: {
                    branches,
                    inputUiInfo: {},
                    executionType: RouterExecutionType.EXECUTE_ALL_MATCH,
                },
                children,
                valid: false,
                nextAction: buildActionsRecursively(steps, index + 1)
            }
        }
    }
}
