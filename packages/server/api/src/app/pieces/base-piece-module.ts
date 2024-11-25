import { PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary } from '@activepieces/pieces-framework'
import {
    ALL_PRINCIPAL_TYPES,
    ApEdition,
    GetPieceRequestParams,
    GetPieceRequestQuery,
    GetPieceRequestWithScopeParams,
    ListPiecesRequestQuery,
    ListVersionRequestQuery,
    ListVersionsResponse,
    PieceCategory,
    PieceOptionRequest,
    PrincipalType,
} from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { engineRunner } from 'server-worker'
import { accessTokenManager } from '../authentication/lib/access-token-manager'
import { flagService } from '../flags/flag.service'
import { flowService } from '../flows/flow/flow.service'
import { sampleDataService } from '../flows/step-run/sample-data.service'
import {
    getPiecePackage,
    pieceMetadataService,
} from './piece-metadata-service'
import { pieceSyncService } from './piece-sync-service'

export const pieceModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(basePiecesController, { prefix: '/v1/pieces' })
}

const basePiecesController: FastifyPluginAsyncTypebox = async (app) => {

    app.get('/versions', ListVersionsRequest, async (req): Promise<ListVersionsResponse> => {
        return pieceMetadataService.getVersions({
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
        async (req): Promise<PieceMetadataModelSummary[]> => {
            const latestRelease = await flagService.getCurrentRelease()
            const includeTags = req.query.includeTags ?? false
            const release = req.query.release ?? latestRelease
            const edition = req.query.edition ?? ApEdition.COMMUNITY
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            const projectId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId
            const pieceMetadataSummary = await pieceMetadataService.list({
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
            })
            return pieceMetadataSummary
        },
    )

    app.get(
        '/:scope/:name',
        GetPieceParamsWithScopeRequest,
        async (req): Promise<PieceMetadata> => {
            const { name, scope } = req.params
            const { version } = req.query

            const decodeScope = decodeURIComponent(scope)
            const decodedName = decodeURIComponent(name)
            const projectId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.projectId
            const platformId = req.principal.type === PrincipalType.UNKNOWN ? undefined : req.principal.platform.id
            return pieceMetadataService.getOrThrow({
                projectId,
                platformId,
                name: `${decodeScope}/${decodedName}`,
                version,
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
            return pieceMetadataService.getOrThrow({
                projectId,
                platformId,
                name: decodedName,
                version,
            })
        },
    )

    app.post(
        '/sync',
        SyncPiecesRequest,
        async (): Promise<void> => {
            await pieceSyncService.sync()
        },
    )

    app.post(
        '/options',
        OptionsPieceRequest,
        async (req) => {
            const request = req.body
            const { projectId, platform } = req.principal
            const flow = await flowService.getOnePopulatedOrThrow({
                projectId,
                id: request.flowId,
                versionId: request.flowVersionId,
            })
            const engineToken = await accessTokenManager.generateEngineToken({
                projectId,
                platformId: platform.id,
            })
            const sampleData = await sampleDataService.getSampleDataForFlow(projectId, flow.version)
            const { result } = await engineRunner.executeProp(engineToken, {
                piece: await getPiecePackage(projectId, platform.id, request),
                flowVersion: flow.version,
                propertyName: request.propertyName,
                actionOrTriggerName: request.actionOrTriggerName,
                input: request.input,
                sampleData,
                projectId,
                searchValue: request.searchValue,
            })

            return result
        },
    )

    app.delete('/:id', DeletePieceRequest, async (req): Promise<void> => {
        return pieceMetadataService.delete({
            projectId: req.principal.projectId,
            id: req.params.id,
        })
    },
    )
}

const ListPiecesRequest = {
    config: {
        allowedPrincipals: ALL_PRINCIPAL_TYPES,
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
const DeletePieceRequest = {
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
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