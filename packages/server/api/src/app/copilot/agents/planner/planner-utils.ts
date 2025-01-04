import { Action, ActionType, assertNotNullOrUndefined, CopilotFlowOutline, CopilotStepPlan, ImportFlowRequest, PackageType, PieceType, Trigger, TriggerType, RouterExecutionType, BranchExecutionType, LATEST_SCHEMA_VERSION, isNil, assertNotEqual, CopilotActionStep, DEFAULT_SAMPLE_DATA_SETTINGS, BranchOperator, CopilotRouterStep } from "@activepieces/shared"
import { nanoid } from "nanoid";
import { pieceEmbeddingService } from "../../embedding/piece-embedding-service";
import { system } from "../../../helper/system/system";

export const plannerUtils = {
    buildWorkflow: async (plan: CopilotFlowOutline): Promise<ImportFlowRequest> => {
        assertNotNullOrUndefined(plan, 'Workflow is required')
        const trigger = await buildTrigger(plan);
        return {
            displayName: plan.name,
            trigger: {
                ...trigger,
                nextAction: await buildActionsRecursively(plan.steps),
            },
            schemaVersion: LATEST_SCHEMA_VERSION,
        }
    }
}

async function buildTrigger(plan: CopilotFlowOutline): Promise<Trigger> {
    const trigger = await findRelatedTrigger(plan);
    return {
        name: 'trigger',
        type: TriggerType.PIECE,
        displayName: plan.trigger.title,
        settings: {
            triggerName: trigger.triggerName,
            pieceName: trigger.pieceName,
            pieceVersion: trigger.pieceVersion,
            pieceType: trigger.pieceType,
            packageType: trigger.packageType,
            input: {},
            inputUiInfo: {},
        },
        valid: true,
    }
}

async function findRelatedTrigger(plan: CopilotFlowOutline): Promise<TriggerMetadata> {
    const relatedPiece = await pieceEmbeddingService(system.globalLogger()).search({
        query: plan.trigger.title,
        type: 'trigger',
    })
    if (isNil(relatedPiece)) {
        return {
            pieceName: '@activepieces/piece-webhook',
            pieceVersion: '0.1.10',
            triggerName: 'catch_webhook',
            pieceType: PieceType.OFFICIAL,
            packageType: PackageType.REGISTRY,
        };
    }
    return {
        pieceName: relatedPiece.metadata.pieceName,
        pieceVersion: relatedPiece.metadata.pieceVersion,
        triggerName: relatedPiece.metadata.stepName,
        pieceType: relatedPiece.metadata.pieceType,
        packageType: relatedPiece.metadata.packageType,
    }
}

async function createAction(action: CopilotActionStep): Promise<Action> {
    const relatedAction = await pieceEmbeddingService(system.globalLogger()).search({
        query: action.title,
        type: 'action',
    })
    const baseAction = {
        name: `step_${nanoid()}`,
        displayName: action.title,
    }
    if (isNil(relatedAction)) {
        return {
            ...baseAction,
            type: ActionType.CODE,
            valid: true,
            settings: {
                input: {},
                inputUiInfo: {},
                sourceCode: {
                    code: `export const code = async (inputs) => { return true; };`,
                    packageJson: '{}',
                },
            },
        }
    }
    return {
        ...baseAction,
        type: ActionType.PIECE,
        valid: false,
        settings: {
            pieceName: relatedAction.metadata.pieceName,
            pieceVersion: relatedAction.metadata.pieceVersion,
            pieceType: relatedAction.metadata.pieceType,
            packageType: relatedAction.metadata.packageType,
            actionName: relatedAction.metadata.stepName,
            input: {},
            inputUiInfo: DEFAULT_SAMPLE_DATA_SETTINGS,
        },
    }
}

async function createRouter(step: CopilotRouterStep, index: number): Promise<Action> {
    const children = await Promise.all(step.branches.map(async (branch) => {
        const child = await buildActionsRecursively(branch.steps, 0);
        return child ? child : null;
    }));
    const branches = step.branches.map(branch => ({
        branchName: branch.condition,
        branchType: BranchExecutionType.CONDITION,
        conditions: [
            [
                {
                    firstValue: '',
                    operator: BranchOperator.TEXT_EXACTLY_MATCHES,
                    secondValue: '',
                }
            ]
        ],
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
        displayName: step.title,
        settings: {
            branches,
            inputUiInfo: {},
            executionType: RouterExecutionType.EXECUTE_ALL_MATCH,
        },
        children,
        valid: false,
    }
}
async function buildActionsRecursively(steps: CopilotStepPlan[], index = 0): Promise<Action | undefined> {
    if (index >= steps.length) {
        return undefined;
    }
    switch (steps[index].type) {
        case 'action': {
            const action = await createAction(steps[index]);
            return {
                ...action,
                nextAction: await buildActionsRecursively(steps, index + 1)
            }
        }
        case 'router': {
            const router = await createRouter(steps[index], index);
            return {
                ...router,
                nextAction: await buildActionsRecursively(steps, index + 1)
            }
        }
    }
}


type TriggerMetadata = {
    pieceName: string;
    pieceVersion: string;
    triggerName: string;
    pieceType: PieceType;
    packageType: PackageType;
}