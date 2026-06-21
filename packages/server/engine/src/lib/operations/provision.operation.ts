import {
    EngineResponse,
    EngineResponseStatus,
    ProvisionOperation,
} from '@activepieces/shared'
import { selectInstallStrategy } from '../provision/piece-install-strategy'

export const provisionOperation = {
    execute: async (operation: ProvisionOperation): Promise<EngineResponse<undefined>> => {
        const strategy = selectInstallStrategy(operation.installStrategy)
        await strategy.install(operation)

        return {
            status: EngineResponseStatus.OK,
            response: undefined,
        }
    },
}
