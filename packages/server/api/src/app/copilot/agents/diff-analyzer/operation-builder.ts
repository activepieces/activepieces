import { AddActionRequest, FlowOperationType, StepLocationRelativeToParent, UpdateActionRequest, ActionType, PackageType, PieceType, RouterExecutionType } from '@activepieces/shared';
import { DiffResult } from '.';

type BuildOperationParams = {
    modification: DiffResult['modifications'][0];
}

export const operationBuilder = {
    buildAddActionOperation({ modification }: BuildOperationParams): { type: FlowOperationType.ADD_ACTION, request: AddActionRequest } | undefined {
        if (modification.type !== 'ADD_ACTION' || !modification.location) {
            return undefined;
        }

        const location = modification.location;

        // Map location type to StepLocationRelativeToParent
        const locationTypeMap: Record<string, StepLocationRelativeToParent> = {
            'AFTER': StepLocationRelativeToParent.AFTER,
            'INSIDE_BRANCH': StepLocationRelativeToParent.INSIDE_BRANCH,
            'INSIDE_LOOP': StepLocationRelativeToParent.INSIDE_LOOP
        };

        // Build the action request based on action type
        const buildActionRequest = (type: string, metadata: Record<string, any>): UpdateActionRequest => {
            const baseAction = {
                name: location.actionName,
                displayName: location.actionName,
                valid: true,
            };

            switch (type) {
                case 'code':
                    return {
                        ...baseAction,
                        type: ActionType.CODE,
                        settings: {
                            input: metadata.input || {},
                            inputUiInfo: metadata.inputUiInfo || {},
                            errorHandlingOptions: metadata.errorHandlingOptions || {},
                            sourceCode: metadata.sourceCode || {
                                code: 'export const code = async (inputs) => { return inputs; };',
                                packageJson: '{}'
                            }
                        }
                    };
                case 'piece':
                    return {
                        ...baseAction,
                        type: ActionType.PIECE,
                        settings: {
                            input: metadata.input || {},
                            inputUiInfo: metadata.inputUiInfo || {},
                            errorHandlingOptions: metadata.errorHandlingOptions || {},
                            pieceName: metadata.pieceName || 'slack',
                            pieceVersion: metadata.pieceVersion || '0.1.0',
                            actionName: metadata.actionName || 'send_message',
                            packageType: PackageType.REGISTRY,
                            pieceType: PieceType.OFFICIAL
                        }
                    };
                case 'loop':
                    return {
                        ...baseAction,
                        type: ActionType.LOOP_ON_ITEMS,
                        settings: {
                            items: metadata.items || '[]',
                            inputUiInfo: metadata.inputUiInfo || {}
                        }
                    };
                case 'router':
                    return {
                        ...baseAction,
                        type: ActionType.ROUTER,
                        settings: {
                            inputUiInfo: metadata.inputUiInfo || {},
                            branches: metadata.branches || [],
                            executionType: RouterExecutionType.EXECUTE_ALL_MATCH
                        }
                    };
                default:
                    throw new Error(`Unsupported action type: ${type}`);
            }
        };

        return {
            type: FlowOperationType.ADD_ACTION,
            request: {
                parentStep: location.parentStepName,
                stepLocationRelativeToParent: locationTypeMap[location.locationType],
                branchIndex: location.branchIndex,
                action: buildActionRequest(
                    location.actionType,
                    location.actionMetadata
                )
            }
        };
    },

    buildOperations(diffResult: DiffResult) {
        const operations = [];

        for (const modification of diffResult.modifications) {
            switch (modification.type) {
                case 'ADD_ACTION': {
                    const operation = this.buildAddActionOperation({ modification });
                    if (operation) operations.push(operation);
                    break;
                }
                // Add other cases here
            }
        }

        return operations;
    }
}; 