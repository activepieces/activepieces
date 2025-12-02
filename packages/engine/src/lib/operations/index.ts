import {
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    ExecuteExtractPieceMetadataOperation,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteTriggerOperation,    
    ExecuteValidateAuthOperation,
    ExecutionError,
    ExecutionErrorType,
    TriggerHookType, 
} from '@activepieces/shared'
import { authValidationOperation } from './auth-validation.operation'
import { flowOperation } from './flow.operation'
import { pieceMetadataOperation } from './piece-metadata.operation'
import { propertyOperation } from './property.operation'
import { triggerHookOperation } from './trigger-hook.operation'


export async function execute(operationType: EngineOperationType, operation: EngineOperation): Promise<EngineResponse<unknown>> {
    switch (operationType) {
        case EngineOperationType.EXTRACT_PIECE_METADATA: {
            return pieceMetadataOperation.extract(operation as ExecuteExtractPieceMetadataOperation)
        }
        case EngineOperationType.EXECUTE_FLOW: {
            return flowOperation.execute(operation as ExecuteFlowOperation)
        }
        case EngineOperationType.EXECUTE_PROPERTY: {
            return propertyOperation.execute(operation as ExecutePropsOptions)
        }
        case EngineOperationType.EXECUTE_TRIGGER_HOOK: {
            return triggerHookOperation.execute(operation as ExecuteTriggerOperation<TriggerHookType>)
        }
        case EngineOperationType.EXECUTE_VALIDATE_AUTH: {
            return authValidationOperation.execute(operation as ExecuteValidateAuthOperation)
        }
        default: {
            throw new ExecutionError('Unsupported operation type', `Unsupported operation type: ${operationType}`, ExecutionErrorType.ENGINE)
        }
    }
}