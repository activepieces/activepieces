import { AppConnection, AppConnectionId, Cursor, ProjectId, SeekPage, UpsertConnectionRequest } from '@activepieces/shared'

export type AppConnectionService = {
    upsert(params: UpsertParams): Promise<AppConnection>

    getOne(params: GetOneParams): Promise<AppConnection | null>

    getOneOrThrow(params: GetOneParams): Promise<AppConnection>

    delete(params: DeleteParams): Promise<void>

    list(params: ListParams): Promise<SeekPage<AppConnection>>
}

type UpsertParams = {
    projectId: ProjectId
    request: UpsertConnectionRequest
}

type GetOneParams = {
    projectId: ProjectId
    name: string
}

type DeleteParams = {
    projectId: ProjectId
    id: AppConnectionId
}

type ListParams = {
    projectId: ProjectId
    appName: string | undefined
    cursorRequest: Cursor | null
    limit: number
}
