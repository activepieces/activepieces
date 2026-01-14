import { PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import { apVersionUtil, ProjectResourceType, securityAccess } from '@activepieces/server-shared'
import {
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    GetPieceRequestParams,
    GetPieceRequestQuery,
    GetPieceRequestWithScopeParams,
    ListPiecesRequestQuery,
    ListVersionRequestQuery,
    ListVersionsResponse,
    LocalesEnum,
    PieceCategory,
    PieceOptionRequest,
    Principal,
    PrincipalType,
    RegistryPiecesRequestQuery,
    SampleDataFileType,
    WorkerJobType,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
} from '@fastify/type-provider-typebox'
import { EngineHelperPropResult, EngineHelperResponse } from 'server-worker'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { pieceSyncService } from '../piece-sync-service'
import { getPiecePackageWithoutArchive, pieceMetadataService } from './piece-metadata-service'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const basePiecesController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/versions', ListVersionsRequest, async (req): Promise<ListVersionsResponse> => {
        return pieceMetadataService(req.log).getVersions({
            name: req.query.name,
            projectId: req.query.projectId,
            release: req.query.release,
            edition: req.query.edition ?? ApEdition.COMMUNITY,
            platformId: getPlatformId(req.principal),
        })
    })

    app.get(
        '/categories',
        ListCategoriesRequest,
        async (): Promise<PieceCategory[]> => {
            return Object.values(PieceCategory)
        },
    )

    app.get('/', ListPiecesRequest, async (req): Promise<PieceMetadataModelSummary[]> => {
        const latestRelease = await apVersionUtil.getCurrentRelease()
        const query = req.query
        const includeTags = query.includeTags ?? false
        const release = query.release ?? latestRelease
        const edition = query.edition ?? ApEdition.COMMUNITY
        const platformId = getPlatformId(req.principal)
        const projectId = req.query.projectId
        const pieceMetadataSummary = await pieceMetadataService(req.log).list({
            release,
            includeHidden: query.includeHidden ?? false,
            projectId,
            platformId,
            edition,
            includeTags,
            categories: query.categories,
            searchQuery: query.searchQuery,
            sortBy: query.sortBy,
            orderBy: query.orderBy,
            suggestionType: query.suggestionType,
            locale: query.locale as LocalesEnum | undefined,
        })
        return pieceMetadataSummary.map((piece) => {
            return {
                ...piece,
                i18n: undefined,
            }
        })
    })

    app.get(
        '/:scope/:name',
        GetPieceParamsWithScopeRequest,
        async (req) => {
            const { name, scope } = req.params
            const { version } = req.query

            const decodeScope = decodeURIComponent(scope)
            const decodedName = decodeURIComponent(name)
            const platformId = getPlatformId(req.principal)
            return pieceMetadataService(req.log).getOrThrow({
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
            const platformId = getPlatformId(req.principal)
            return pieceMetadataService(req.log).getOrThrow({
                platformId,
                name: decodedName,
                version,
                locale: req.query.locale as LocalesEnum | undefined,
            })
        },
    )

    app.get('/registry', RegistryPiecesRequest, async (req) => {
        const pieces = await pieceMetadataService(req.log).registry({
            release: req.query.release,
            edition: req.query.edition,
            platformId: getPlatformId(req.principal),
        })
        return pieces
    })

    app.post('/sync', SyncPiecesRequest, async (req) => pieceSyncService(req.log).sync())

    app.post(
        '/options',
        OptionsPieceRequest,
        async (req) => {
            const projectId = req.projectId
            const platform = req.principal.platform
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
                piece: await getPiecePackageWithoutArchive(req.log, platform.id, req.body),
            })
            return result
        },
    )

}

function getPlatformId(principal: Principal): string | undefined {
    return principal.type === PrincipalType.WORKER || principal.type === PrincipalType.UNKNOWN ? undefined : principal.platform?.id
}

const RegistryPiecesRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        querystring: RegistryPiecesRequestQuery,
    },
}

const ListPiecesRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        querystring: ListPiecesRequestQuery,

    },

}
const GetPieceParamsRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: GetPieceRequestParams,
        querystring: GetPieceRequestQuery,
    },
}

const GetPieceParamsWithScopeRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        params: GetPieceRequestWithScopeParams,
        querystring: GetPieceRequestQuery,
    },
}

const ListCategoriesRequest = {
    config: {
        security: securityAccess.public(),
    },
    schema: {
        querystring: ListPiecesRequestQuery,
    },
}

const OptionsPieceRequest = {
    schema: {
        body: PieceOptionRequest,
    },
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.BODY,
        }),
    },
}


const ListVersionsRequest = {
    config: {
        security: securityAccess.unscoped(ALL_PRINCIPAL_TYPES),
    },
    schema: {
        querystring: ListVersionRequestQuery,
    },
}

const SyncPiecesRequest = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}