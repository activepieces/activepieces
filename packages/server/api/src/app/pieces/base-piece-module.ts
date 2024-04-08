import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { flagService } from '../flags/flag.service'
import { flowService } from '../flows/flow/flow.service'
import { engineHelper } from '../helper/engine-helper'
import {
    getPiecePackage,
    pieceMetadataService,
} from './piece-metadata-service'
import { pieceSyncService } from './piece-sync-service'
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
            return pieceMetadataService.getOrThrow({
                projectId,
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
            return pieceMetadataService.getOrThrow({
                projectId,
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
            const {
                packageType,
                pieceType,
                pieceName,
                pieceVersion,
                propertyName,
                stepName,
                input,
                flowVersionId,
                flowId,
                searchValue,
            } = req.body
            const { projectId } = req.principal
            const flow = await flowService.getOnePopulatedOrThrow({
                projectId,
                id: flowId,
                versionId: flowVersionId,
            })
            const { result } = await engineHelper.executeProp({
                piece: await getPiecePackage(projectId, {
                    packageType,
                    pieceType,
                    pieceName,
                    pieceVersion,
                }),
                flowVersion: flow.version,
                propertyName,
                stepName,
                input,
                projectId,
                searchValue,
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