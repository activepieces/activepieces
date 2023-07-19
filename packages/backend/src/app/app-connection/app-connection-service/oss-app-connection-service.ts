import { ProjectId, UpsertConnectionRequest } from '@activepieces/shared'
import { BaseAppConnectionService } from './base-app-connection-service'
import { logger } from '../../helper/logger'

export class OssAppConnectionService extends BaseAppConnectionService {
    protected override async preUpsertHook(params: UpsertParams): Promise<void> {
        logger.debug(params, '[OssAppConnectionService#preUpsertHook] params')
    }
}

type UpsertParams = {
    projectId: ProjectId
    request: UpsertConnectionRequest
}
