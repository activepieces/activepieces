import { CrowdinError, ProjectsGroups, ResponseList, SourceFiles, SourceStrings, StringComments, StringTranslations } from '@crowdin/crowdin-api-client'
import { crowdinHttpClient, SendRequest, WaitBeforeRetry } from './crowdin-http-client'
import { IdentifierAndText } from './rename-journal'

function create({ token, projectId, sendRequest, waitBeforeRetry }: CreateCrowdinProjectApiParams): CrowdinProjectApi {
    const credentials = { token }
    const config = { httpClient: crowdinHttpClient.create({ sendRequest, waitBeforeRetry }) }
    return {
        projectId,
        projectsGroupsApi: new ProjectsGroups(credentials, config),
        sourceFilesApi: new SourceFiles(credentials, config),
        sourceStringsApi: new SourceStrings(credentials, config),
        stringTranslationsApi: new StringTranslations(credentials, config),
        stringCommentsApi: new StringComments(credentials, config),
    }
}

async function readStringText({ crowdin, stringId }: { crowdin: CrowdinProjectApi, stringId: number }): Promise<IdentifierAndText | null> {
    try {
        const crowdinString = await crowdin.sourceStringsApi.getString(crowdin.projectId, stringId)
        const { identifier, text } = crowdinString.data
        return { identifier, text: typeof text === 'string' ? text : JSON.stringify(text) }
    }
    catch {
        return null
    }
}

function resourcesOf<T>({ responseList }: { responseList: ResponseList<T> }): T[] {
    return responseList.data.map((responseObject) => responseObject.data)
}

async function deleteUnlessAlreadyGone({ sendDelete }: { sendDelete: () => Promise<unknown> }): Promise<DeletionOutcome> {
    try {
        await sendDelete()
        return { ok: true }
    }
    catch (error) {
        return isNotFoundError({ error }) ? { ok: true } : { ok: false, message: shortErrorMessageOf({ error }) }
    }
}

function isNotFoundError({ error }: { error: unknown }): boolean {
    return error instanceof CrowdinError && error.code === 404
}

function shortErrorMessageOf({ error }: { error: unknown }): string {
    return (error instanceof Error ? error.message : String(error)).split('\n')[0].slice(0, MAX_ERROR_MESSAGE_LENGTH)
}

const MAX_ERROR_MESSAGE_LENGTH = 300

export const crowdinProjectApi = { create, resourcesOf, readStringText, deleteUnlessAlreadyGone, shortErrorMessageOf }

export type CrowdinProjectApi = {
    projectId: number
    projectsGroupsApi: ProjectsGroups
    sourceFilesApi: SourceFiles
    sourceStringsApi: SourceStrings
    stringTranslationsApi: StringTranslations
    stringCommentsApi: StringComments
}

export type DeletionOutcome = { ok: true } | { ok: false, message: string }

type CreateCrowdinProjectApiParams = {
    token: string
    projectId: number
    sendRequest?: SendRequest
    waitBeforeRetry?: WaitBeforeRetry
}
