import { ExecuteActionOperation } from '@activepieces/shared'
import { engineHelper } from '../../helper/engine-helper'

export const stepRunService = {
    async test(operation: ExecuteActionOperation): Promise<unknown> {
        return await engineHelper.executeAction(operation)
    },
}
