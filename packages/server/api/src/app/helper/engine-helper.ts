
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import {
    apId,
    PrincipalType,
    ProjectId,
} from '@activepieces/shared'
type GenerateEngineTokenParams = {
    projectId: ProjectId
    jobId?: string
}


export const generateEngineToken = ({
    jobId,
    projectId,
}: GenerateEngineTokenParams): Promise<string> => {
    return accessTokenManager.generateToken({
        id: jobId ?? apId(),
        type: PrincipalType.ENGINE,
        projectId,
        // TODO NOW remove this hack
        platform: {
            id: apId(),
        },
    })
}

