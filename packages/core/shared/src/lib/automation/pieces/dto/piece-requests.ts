import { ApMultipartFile, OptionalArrayFromQuery, OptionalBooleanFromQuery } from '@activepieces/core-utils'
import { z } from 'zod'
import { ApEdition } from '../../../core/flag/flag'
import { PackageType, PieceCategory } from '../piece'

export const EXACT_VERSION_PATTERN = '^[0-9]+\\.[0-9]+\\.[0-9]+$'
export const EXACT_VERSION_REGEX = new RegExp(EXACT_VERSION_PATTERN)
const VERSION_PATTERN = '^([~^])?[0-9]+\\.[0-9]+\\.[0-9]+$'

export const ExactVersionType = z.string().regex(new RegExp(EXACT_VERSION_PATTERN))

export const VersionType = z.string().regex(new RegExp(VERSION_PATTERN))

export enum SuggestionType {
    ACTION = 'ACTION',
    TRIGGER = 'TRIGGER',
    ACTION_AND_TRIGGER = 'ACTION_AND_TRIGGER',
}
export enum PieceSortBy {
    NAME = 'NAME',
    UPDATED = 'UPDATED',
    CREATED = 'CREATED',
    POPULARITY = 'POPULARITY',
}

export enum PieceOrderBy {
    ASC = 'ASC',
    DESC = 'DESC',
}

// Audience perspective for filtering actions out of the human piece metadata responses.
// `both`-tagged and untagged actions are always included; only the opposite single audience
// is hidden. Defaults to HUMAN (hide `audience: 'ai'`) on the human-facing endpoints.
export enum PieceAudienceFilter {
    HUMAN = 'human',
    AI = 'ai',
    ALL = 'all',
}

// Whether an action with the given `audience` tag is visible for the requested perspective.
// `both` and untagged actions (untagged defaults to `both`) are visible everywhere; only the
// opposite single audience is hidden. Takes the tag as a string to avoid a dependency on the
// pieces-framework `Audience` type.
export function isAudienceVisible(actionAudience: string | undefined, filter: PieceAudienceFilter): boolean {
    if (filter === PieceAudienceFilter.ALL) {
        return true
    }
    if (filter === PieceAudienceFilter.AI) {
        return actionAudience !== 'human'
    }
    return actionAudience !== 'ai'
}

export const GetPieceRequestWithScopeParams = z.object({
    name: z.string(),
    scope: z.string(),
})

export type GetPieceRequestWithScopeParams = z.infer<typeof GetPieceRequestWithScopeParams>


export const GetPieceRequestParams = z.object({
    name: z.string(),
})

export type GetPieceRequestParams = z.infer<typeof GetPieceRequestParams>

export const ListPiecesRequestQuery = z.object({
    projectId: z.string().optional(),
    release: ExactVersionType.optional(),
    includeTags: OptionalBooleanFromQuery,
    includeHidden: OptionalBooleanFromQuery,
    audience: z.nativeEnum(PieceAudienceFilter).optional(),
    edition: z.nativeEnum(ApEdition).optional(),
    searchQuery: z.string().optional(),
    sortBy: z.nativeEnum(PieceSortBy).optional(),
    orderBy: z.nativeEnum(PieceOrderBy).optional(),
    categories: OptionalArrayFromQuery(z.nativeEnum(PieceCategory)),
    suggestionType: z.nativeEnum(SuggestionType).optional(),
    locale: z.string().optional(),
})

export type ListPiecesRequestQuery = z.infer<typeof ListPiecesRequestQuery>


export const RegistryPiecesRequestQuery = z.object({
    release: ExactVersionType,
    edition: z.nativeEnum(ApEdition),
})

export type RegistryPiecesRequestQuery = z.infer<typeof RegistryPiecesRequestQuery>

export const GetPieceRequestQuery = z.object({
    version: VersionType.optional(),
    projectId: z.string().optional(),
    locale: z.string().optional(),
    audience: z.nativeEnum(PieceAudienceFilter).optional(),
})

export type GetPieceRequestQuery = z.infer<typeof GetPieceRequestQuery>

export const PieceOptionRequest = z.object({
    projectId: z.string(),
    pieceName: z.string(),
    pieceVersion: VersionType,
    actionOrTriggerName: z.string(),
    propertyName: z.string(),
    flowId: z.string(),
    flowVersionId: z.string(),
    input: z.any(),
    searchValue: z.string().optional(),
})

export type PieceOptionRequest = z.infer<typeof PieceOptionRequest>

export enum PieceScope {
    PLATFORM = 'PLATFORM',
}

export const AddPieceRequestBody = z.union([
    z.object({
        packageType: z.literal(PackageType.ARCHIVE),
        scope: z.literal(PieceScope.PLATFORM),
        pieceName: z.string().min(1),
        pieceVersion: ExactVersionType,
        pieceArchive: ApMultipartFile,
    }).describe('Private Piece'),
    z.object({
        packageType: z.literal(PackageType.REGISTRY),
        scope: z.literal(PieceScope.PLATFORM),
        pieceName: z.string().min(1),
        pieceVersion: ExactVersionType,
    }).describe('NPM Piece'),
])

export type AddPieceRequestBody = z.infer<typeof AddPieceRequestBody>

