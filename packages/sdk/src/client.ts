import { createHttpClient } from './http'
import { createProjectSession, ProjectSession } from './session'
import { ApSdkClientConfig, SdkProject } from './types'

export function createClient(config: ApSdkClientConfig): ApSdkClient {
    const http = createHttpClient(config)

    return {
        async project(externalId: string): Promise<ProjectSession> {
            const project = await http.post<SdkProject>('/v1/sdk/projects', {
                body: { externalId },
            })
            return createProjectSession({ http, projectId: project.id })
        },
    }
}

export type ApSdkClient = {
    project: (externalId: string) => Promise<ProjectSession>
}
