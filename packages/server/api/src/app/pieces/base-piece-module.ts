import { PieceMetadataModel } from '@activepieces/pieces-framework'
import { apVersionUtil } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    EndpointScope,
    GetPieceRequestParams,
    GetPieceRequestQuery,
    GetPieceRequestWithScopeParams,
    ListPiecesRequestQuery,
    ListVersionRequestQuery,
    ListVersionsResponse,
    LocalesEnum,
    PieceCategory,
    PieceOptionRequest,
    PrincipalType,
    SampleDataFileType,
    WorkerJobType,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { flowService } from '../flows/flow/flow.service'
import { sampleDataService } from '../flows/step-run/sample-data.service'
import { userInteractionWatcher } from '../workers/user-interaction-watcher'
import {
    getPiecePackageWithoutArchive,
    pieceMetadataService,
} from './piece-metadata-service'
import { pieceSyncService } from './piece-sync-service'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const basePiecesController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/versions', ListVersionsRequest, async (req): Promise<ListVersionsResponse> => {
        return pieceMetadataService(req.log).getVersions({
            name: req.query.name,
            projectId: req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId,
            release: req.query.release,
            edition: req.query.edition ?? ApEdition.COMMUNITY,
            platformId: req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id,
        })
    })

    app.get(
        '/categories',
        ListCategoriesRequest,
        async (): Promise<PieceCategory[]> => {
            return Object.values(PieceCategory)
        },
    )

    app.get(
        '/',
        ListPiecesRequest,
        async (req) => {
            const latestRelease = await apVersionUtil.getCurrentRelease()
            const includeTags = req.query.includeTags ?? false
            const release = req.query.release ?? latestRelease
            const edition = req.query.edition ?? ApEdition.COMMUNITY
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            const projectId = [PrincipalType.UNKNOWN, PrincipalType.SERVICE].includes(req.principal.type) ? undefined : req.principal.projectId
            const pieceMetadataSummary = await pieceMetadataService(req.log).list({
                release,
                includeHidden: req.query.includeHidden ?? false,
                projectId,
                platformId,
                edition,
                includeTags,
                categories: req.query.categories,
                searchQuery: req.query.searchQuery,
                sortBy: req.query.sortBy,
                orderBy: req.query.orderBy,
                suggestionType: req.query.suggestionType,
                locale: req.query.locale as LocalesEnum | undefined,
            })
            return pieceMetadataSummary.map((piece) => {
                return {
                    ...piece,
                    i18n: undefined,
                }
            })
        },
    )

    app.get(
        '/:scope/:name',
        GetPieceParamsWithScopeRequest,
        async (req) => {
            const { name, scope } = req.params
            const { version } = req.query

            const decodeScope = decodeURIComponent(scope)
            const decodedName = decodeURIComponent(name)
            const projectId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            return pieceMetadataService(req.log).getOrThrow({
                projectId,
                platformId,
                name: `${decodeScope}/${decodedName}`,
                version,
                locale: req.query.locale as LocalesEnum | undefined,
            })
        },
    )

    app.get(
        '/:name',
        GetPieceParamsRequest,
        async (req): Promise<PieceMetadataModel> => {
            const { name } = req.params
            const { version } = req.query
            const decodedName = decodeURIComponent(name)
            const projectId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            return pieceMetadataService(req.log).getOrThrow({
                projectId,
                platformId,
                name: decodedName,
                version,
                locale: req.query.locale as LocalesEnum | undefined,
            })
        },
    )

    app.post('/sync', SyncPiecesRequest, async (req) => pieceSyncService(req.log).sync())

    app.post(
        '/options',
        OptionsPieceRequest,
        async (req) => {
            const { projectId, platform } = req.principal
            const flow = await flowService(req.log).getOnePopulatedOrThrow({
                projectId,
                id: req.body.flowId,
                versionId: req.body.flowVersionId,
            })
            const sampleData = await sampleDataService(req.log).getSampleDataForFlow(projectId, flow.version, SampleDataFileType.OUTPUT)
            const { result } = await userInteractionWatcher(req.log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperPropResult>>({
                jobType: WorkerJobType.EXECUTE_PROPERTY,
                platformId: platform.id,
                projectId,
                flowVersion: flow.version,
                propertyName: req.body.propertyName,
                actionOrTriggerName: req.body.actionOrTriggerName,
                input: req.body.input,
                sampleData,
                searchValue: req.body.searchValue,
                piece: await getPiecePackageWithoutArchive(req.log, projectId, platform.id, req.body),
            })
            return result
        },
    )

}

const ListPiecesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
        scope: EndpointScope.PLATFORM,
    },
    schema: {
        querystring: ListPiecesRequestQuery,

    },

}
const GetPieceParamsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: GetPieceRequestParams,
        querystring: GetPieceRequestQuery,

    },

}

const GetPieceParamsWithScopeRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        params: GetPieceRequestWithScopeParams,
        querystring: GetPieceRequestQuery,
    },
}

const ListCategoriesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: ListPiecesRequestQuery,
    },
}

const OptionsPieceRequest = {
    schema: {
        body: PieceOptionRequest,
    },
}


const ListVersionsRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
    },
    schema: {
        querystring: ListVersionRequestQuery,
    },
}

const SyncPiecesRequest = {
    config: {
        allowedPrincipals: [PrincipalType.USER],
    },
}