import { ActivepiecesError, apId, assertNotNullOrUndefined, ErrorCode, isNil, LocalesEnum, localeUtils, PlatformId } from '@activepieces/core-utils'
import { PieceMetadata, PieceMetadataModel, PieceMetadataModelSummary, PiecePackageInformation, pieceTranslation } from '@activepieces/pieces-framework'
import { apVersionUtil } from '@activepieces/server-utils'
import { EXACT_VERSION_REGEX, flowPieceUtil, PackageType, PieceAudienceFilter, PieceCategory, PieceOrderBy, PiecePackage, PieceSortBy, PieceType, PrivatePiecePackage, PublicPiecePackage, SuggestionType } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { EntityManager, In, IsNull } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { resolveVisibility } from '../../ee/pieces/filters/piece-filtering-utils'
import { flowVersionRepo } from '../../flows/flow-version/flow-version.service'
import { projectService } from '../../project/project-service'
import { currentPieceGeneration, pieceCache, PieceRegistryEntry } from './piece-cache'
import { PieceMetadataEntity, PieceMetadataSchema } from './piece-metadata-entity'
import { filterActionsByAudience, filterPieceBasedOnType, isNewerVersion, isSupportedRelease, lastVersionOfEachPiece, loadDevPiecesIfEnabled, pieceListUtils } from './utils'
import { createGenerationMemo } from './utils/generation-memo'

export const pieceRepos = repoFactory(PieceMetadataEntity)

export const pieceMetadataService = (log: FastifyBaseLogger) => {
    return {
        async setup(): Promise<void> {
            await pieceCache(log).setup()
        },
        async list(params: ListParams): Promise<PieceMetadataModelSummary[]> {
            const locale = localeUtils.toSupportedLocale(params.locale)
            const catalogue = await catalogueByLocale.get({ key: locale, load: () => fillCatalogue({ locale, log }) })
            const platformPieces = lastVersionOfEachPiece(catalogue.filter((piece) => filterPieceBasedOnType(params.platformId, piece)))
            const policy = await resolveVisibility({ platformId: params.platformId, projectId: params.projectId, log })
            const audience = params.audience ?? PieceAudienceFilter.HUMAN
            const audiencePieces = platformPieces.map((piece) => ({ ...piece, actions: filterActionsByAudience(piece.actions, audience) }))
            const sortedPieces = await pieceListUtils(log).sortAndSearchPieces({
                ...params,
                pieces: audiencePieces,
                suggestionType: params.suggestionType,
            })
            const visiblePieces = params.includeHidden ? sortedPieces : sortedPieces.filter((piece) => !piece.deprecated)
            const filteredPieces = params.includeHidden || isNil(policy) ? visiblePieces : policy.filterPieces(visiblePieces)

            const summaries = toPieceMetadataModelSummary({ pieces: filteredPieces, originalPieces: audiencePieces, suggestionType: params.suggestionType })
            return params.includeHidden || isNil(policy) ? summaries : policy.filterComponents(summaries)
        },
        async registry(params: RegistryParams): Promise<PiecePackageInformation[]> {
            const registry = filterRegistry(await pieceCache(log).loadRegistry(), {
                release: params.release,
                platformId: params.platformId,
            })
            return registry.map((piece) => ({
                name: piece.name,
                version: piece.version,
            }))
        },
        async get({ projectId, platformId, version, name, includeTranslations = false }: GetOrThrowParams): Promise<PieceMetadataModel | undefined> {
            const bestMatch = await findExactVersion(log, { name, version, platformId })
            if (isNil(bestMatch)) {
                return undefined
            }
            const piece = await dedupe(`piece:${bestMatch.name}:${bestMatch.version}:${bestMatch.platformId ?? ''}:${includeTranslations}`, () => fetchPieceVersion({
                pieceName: bestMatch.name,
                version: bestMatch.version,
                platformId: bestMatch.platformId,
                includeTranslations,
                log,
            }))

            if (isNil(piece)) {
                return undefined
            }

            const policy = await resolveVisibility({ platformId, projectId, log })
            if (isNil(policy)) {
                return piece
            }
            if (!policy.isPieceVisible(piece.name)) {
                return undefined
            }
            return policy.filterPieceComponents(piece)
        },
        async getOrThrow({ version, name, platformId, locale, includeTranslations = false }: GetOrThrowParams): Promise<PieceMetadataModel> {
            const piece = await this.get({ version, name, platformId, includeTranslations })
            if (isNil(piece)) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: {
                        message: `piece_metadata_not_found pieceName=${name}`,
                    },
                })
            }
            const translations = await findTranslations({ piece, locale: localeUtils.toSupportedLocale(locale) })
            return {
                ...pieceTranslation.translatePiece({ piece, translations }),
                i18n: includeTranslations ? piece.i18n : undefined,
            }
        },
        async updateUsages({ usages }: UpdateUsagesParams): Promise<void> {
            if (usages.length === 0) {
                return
            }
            for (const { id, usage } of usages) {
                const existingMetadata = await pieceRepos().findOneByOrFail({ id })
                await pieceRepos().update(id, {
                    projectUsage: usage,
                    updated: existingMetadata.updated,
                    created: existingMetadata.created,
                })
            }
            await pieceCache(log).invalidate()
        },
        async resolveExactVersion({ name, version, platformId }: GetExactPieceVersionParams): Promise<string> {
            const isExactVersion = EXACT_VERSION_REGEX.test(version)

            if (isExactVersion) {
                return version
            }

            const pieceMetadata = await this.getOrThrow({
                name,
                version,
                platformId,
            })

            return pieceMetadata.version
        },
        async create({
            pieceMetadata,
            platformId,
            packageType,
            pieceType,
            archiveId,
            publishCacheRefresh = true,
        }: CreateParams): Promise<PieceMetadataSchema> {
            const existingMetadata = await pieceRepos().findOneBy({
                name: pieceMetadata.name,
                version: pieceMetadata.version,
                platformId: platformId ?? IsNull(),
            })
            if (!isNil(existingMetadata)) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: `piece_metadata_already_exists name=${pieceMetadata.name} version=${pieceMetadata.version}`,
                    },
                })
            }
            const createdDate = await findOldestCreatedDate({
                name: pieceMetadata.name,
                platformId,
            })
            const savedPiece = await pieceRepos().save({
                id: apId(),
                packageType,
                pieceType,
                archiveId,
                platformId,
                created: createdDate,
                ...pieceMetadata,
            })
            if (publishCacheRefresh) {
                await pieceCache(log).invalidate()
            }
            return savedPiece
        },

        async bulkDelete(pieces: { name: string, version: string }[]): Promise<void> {
            if (pieces.length === 0) {
                return
            }
            await Promise.all(pieces.map((piece) =>
                pieceRepos().delete({ name: piece.name, version: piece.version }),
            ))
            await pieceCache(log).invalidate()
        },

        async delete({ id, platformId }: DeleteParams): Promise<void> {
            const piece = await pieceRepos().findOneBy({ id })
            if (isNil(piece) || piece.platformId !== platformId) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENTITY_NOT_FOUND,
                    params: { entityType: 'piece', entityId: id },
                })
            }
            if (piece.pieceType !== PieceType.CUSTOM) {
                throw new ActivepiecesError({
                    code: ErrorCode.AUTHORIZATION,
                    params: { message: 'Only custom pieces can be deleted' },
                })
            }
            const flowsUsingPiece = await findFlowsUsingPiece({ pieceName: piece.name, platformId, log })
            if (flowsUsingPiece.length > 0) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: buildPieceInUseMessage(flowsUsingPiece) },
                })
            }
            await pieceRepos().delete({ name: piece.name, platformId, pieceType: PieceType.CUSTOM })
            await pieceCache(log).invalidate()
        },
    }
}

async function findFlowsUsingPiece({ pieceName, platformId, log }: FindFlowsUsingPieceParams): Promise<string[]> {
    const projectIds = await projectService(log).getProjectIdsByPlatform(platformId)
    if (projectIds.length === 0) {
        return []
    }
    const latestVersionSubquery = flowVersionRepo()
        .createQueryBuilder('fv_latest')
        .select('fv_latest.id')
        .where('fv_latest."flowId" = flow.id')
        .orderBy('fv_latest.created', 'DESC')
        .limit(1)

    const candidates = await flowVersionRepo().createQueryBuilder('flow_version')
        .innerJoin('flow_version.flow', 'flow')
        .where('flow."projectId" IN (:...projectIds)', { projectIds })
        .andWhere('flow_version.trigger::text LIKE :needle', { needle: `%"${pieceName}"%` })
        .andWhere(`(flow_version.id = flow."publishedVersionId" OR flow_version.id = (${latestVersionSubquery.getQuery()}))`)
        .getMany()

    const flowNamesById = new Map<string, string>()
    for (const flowVersion of candidates) {
        if (!flowNamesById.has(flowVersion.flowId) && flowPieceUtil.getUsedPieces(flowVersion.trigger).includes(pieceName)) {
            flowNamesById.set(flowVersion.flowId, flowVersion.displayName)
        }
    }
    return [...flowNamesById.values()]
}

function buildPieceInUseMessage(flowNames: string[]): string {
    const previewLimit = 3
    const preview = flowNames.slice(0, previewLimit).map((name) => `"${name}"`).join(', ')
    const remaining = flowNames.length - previewLimit
    const flowList = remaining > 0 ? `${preview} and ${remaining} more` : preview
    if (flowNames.length === 1) {
        return `Cannot delete this piece because it is still used by the flow ${flowList}. Remove the piece from that flow first.`
    }
    return `Cannot delete this piece because it is still used by ${flowNames.length} flows: ${flowList}. Remove the piece from those flows first.`
}

export const getPiecePackageWithoutArchive = async (
    log: FastifyBaseLogger,
    platformId: PlatformId | undefined,
    pkg: Omit<PublicPiecePackage, 'directoryPath' | 'pieceType' | 'packageType'> | Omit<PrivatePiecePackage, 'archiveId' | 'archive' | 'pieceType' | 'packageType'>,
): Promise<PiecePackage> => {
    const pieceMetadata = await pieceMetadataService(log).getOrThrow({
        name: pkg.pieceName,
        version: pkg.pieceVersion,
        platformId,
    })
    switch (pieceMetadata.packageType) {
        case PackageType.ARCHIVE:
            assertNotNullOrUndefined(pieceMetadata.platformId, 'platformId is required')
            return {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
                pieceType: pieceMetadata.pieceType,
                packageType: pieceMetadata.packageType,
                archiveId: pieceMetadata.archiveId!,
                platformId: pieceMetadata.platformId,
            }
        case PackageType.REGISTRY: {
            const piecePlatformId = pieceMetadata.platformId
            if (pieceMetadata.pieceType === PieceType.CUSTOM) {
                assertNotNullOrUndefined(piecePlatformId, 'platformId is required')
                return {
                    pieceName: pieceMetadata.name,
                    pieceVersion: pieceMetadata.version,
                    packageType: pieceMetadata.packageType,
                    pieceType: pieceMetadata.pieceType,
                    platformId: piecePlatformId,
                }
            }
            return {
                pieceName: pieceMetadata.name,
                pieceVersion: pieceMetadata.version,
                packageType: pieceMetadata.packageType,
                pieceType: pieceMetadata.pieceType,
            }
        }
        default: {
            throw new Error(`Unhandled packageType: ${(pieceMetadata as { packageType: string }).packageType}`)
        }
    }
}

export function toPieceMetadataModelSummary<T extends PieceMetadataSchema | PieceMetadataModel>({ pieces, originalPieces, suggestionType }: ToPieceMetadataModelSummaryParams<T>): PieceMetadataModelSummary[] {
    const originalPieceByName = new Map(originalPieces.map((piece) => [piece.name, piece]))
    return pieces.map((piece) => {
        const originalPiece = originalPieceByName.get(piece.name)
        assertNotNullOrUndefined(originalPiece, `Original metadata not found for ${piece.name}`)
        return {
            ...piece,
            actions: Object.keys(originalPiece.actions).length,
            triggers: Object.keys(originalPiece.triggers).length,
            suggestedActions: suggestionType === SuggestionType.ACTION || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(piece.actions) : undefined,
            suggestedTriggers: suggestionType === SuggestionType.TRIGGER || suggestionType === SuggestionType.ACTION_AND_TRIGGER ?
                Object.values(piece.triggers) : undefined,
        }
    })
}

const findOldestCreatedDate = async ({ name, platformId }: { name: string, platformId?: string }): Promise<string> => {
    const piece = await pieceRepos().findOne({
        where: {
            name,
            platformId: platformId ?? IsNull(),
        },
        order: {
            created: 'ASC',
        },
    })
    return piece?.created ?? dayjs().toISOString()
}

const sortByVersionDescending = <T extends { version: string }>(a: T, b: T): number => {
    const aValid = semVer.valid(a.version)
    const bValid = semVer.valid(b.version)
    if (!aValid && !bValid) {
        return b.version.localeCompare(a.version)
    }
    if (!aValid) {
        return 1
    }
    if (!bValid) {
        return -1
    }
    return semVer.rcompare(a.version, b.version)
}

const findExactVersion = async (
    log: FastifyBaseLogger,
    params: { name: string, version: string | undefined, platformId: string | undefined },
): Promise<{ name: string, version: string, platformId: string | undefined } | undefined> => {
    const { name, version, platformId } = params
    const versionToSearch = findNextExcludedVersion(version)
    const currentRelease = apVersionUtil.getCurrentRelease()
    const registry = filterRegistry(await pieceCache(log).loadRegistry(), { release: currentRelease, platformId })
    const matchingRegistryEntries = registry.filter((entry) => {
        if (entry.name !== name) {
            return false
        }
        if (isNil(versionToSearch)) {
            return true
        }
        return semVer.compare(entry.version, versionToSearch.nextExcludedVersion) < 0
            && semVer.compare(entry.version, versionToSearch.baseVersion) >= 0
    })

    if (matchingRegistryEntries.length === 0) {
        return undefined
    }

    const sortedEntries = matchingRegistryEntries.sort(sortByVersionDescending)
    return {
        name: sortedEntries[0].name,
        version: sortedEntries[0].version,
        platformId: sortedEntries[0].platformId,
    }
}

const findNextExcludedVersion = (version: string | undefined): { baseVersion: string, nextExcludedVersion: string } | undefined => {
    if (version?.startsWith('^')) {
        const baseVersion = version.substring(1)
        return {
            baseVersion,
            nextExcludedVersion: increaseMajorVersion(baseVersion),
        }
    }
    if (version?.startsWith('~')) {
        const baseVersion = version.substring(1)
        return {
            baseVersion,
            nextExcludedVersion: increaseMinorVersion(baseVersion),
        }
    }
    if (isNil(version)) {
        return undefined
    }
    return {
        baseVersion: version,
        nextExcludedVersion: increasePatchVersion(version),
    }
}

const increasePatchVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'patch')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase patch version ${version}`)
    }
    return incrementedVersion
}

const increaseMinorVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'minor')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase minor version ${version}`)
    }
    return incrementedVersion
}

const increaseMajorVersion = (version: string): string => {
    const incrementedVersion = semVer.inc(version, 'major')
    if (isNil(incrementedVersion)) {
        throw new Error(`Failed to increase major version ${version}`)
    }
    return incrementedVersion
}

const latestCompatiblePieces = createGenerationMemo<PieceMetadataSchema[]>({ currentGeneration: currentPieceGeneration })
const catalogueByLocale = createGenerationMemo<PieceMetadataSchema[]>({ currentGeneration: currentPieceGeneration })

async function fillCatalogue({ locale, log }: FillCatalogueParams): Promise<PieceMetadataSchema[]> {
    const startedAt = performance.now()
    const pieces = await loadCataloguePieces({ log })
    const storedTranslations = locale === LocalesEnum.ENGLISH
        ? undefined
        : await fetchTranslationsForLocale({ pieceIds: pieces.map((piece) => piece.id), locale })
    const catalogue = pieces.map((piece) => ({
        ...pieceTranslation.translatePiece({
            piece,
            translations: isNil(storedTranslations) ? undefined : piece.i18n?.[locale] ?? storedTranslations.get(piece.id),
        }),
        i18n: undefined,
    }))
    log.info({ pieceCatalogue: { locale, pieceCount: catalogue.length, durationMs: Math.round(performance.now() - startedAt) } }, '[pieceCatalogue] Filled')
    return catalogue
}

async function loadCataloguePieces({ log }: LoadCataloguePiecesParams): Promise<PieceMetadataSchema[]> {
    const currentRelease = apVersionUtil.getCurrentRelease()
    const [storedPieces, devPieces] = await Promise.all([
        latestCompatiblePieces.get({ key: currentRelease, load: () => fetchLatestCompatiblePiecesFromDB(currentRelease) }),
        loadDevPiecesIfEnabled(log),
    ])
    const devPieceNames = new Set(devPieces.map((piece) => piece.name))
    return [
        ...storedPieces.filter((piece) => !devPieceNames.has(piece.name)),
        ...devPieces.filter((piece) => isSupportedRelease(currentRelease, piece)),
    ]
}

async function fetchPieceVersion({ pieceName, version, platformId, includeTranslations, log }: FetchPieceVersionParams): Promise<PieceMetadataSchema | null> {
    const devPieces = await loadDevPiecesIfEnabled(log)
    const devPiece = devPieces.find((p) => p.name === pieceName && p.version === version)
    if (!isNil(devPiece)) {
        return devPiece
    }

    const query = pieceRepos().createQueryBuilder('pm').where({
        name: pieceName,
        version,
        platformId: platformId ?? IsNull(),
    })
    return (includeTranslations ? query.addSelect('pm.i18n') : query).getOne()
}

export async function fetchLatestCompatiblePiecesFromDB(currentRelease: string): Promise<PieceMetadataSchema[]> {
    const allKeys = await pieceRepos()
        .createQueryBuilder('pm')
        .select(['pm."id"', 'pm."name"', 'pm."version"', 'pm."platformId"', 'pm."minimumSupportedRelease"', 'pm."maximumSupportedRelease"'])
        .getRawMany<PieceKey>()

    const compatibleKeys = allKeys.filter((piece) => isSupportedRelease(currentRelease, piece))
    const latestIds = pickLatestVersionIds(compatibleKeys)
    if (latestIds.length === 0) {
        return []
    }
    return pieceRepos().find({ where: { id: In(latestIds) } })
}

function pickLatestVersionIds(pieces: PieceKey[]): string[] {
    const latest = new Map<string, PieceKey>()
    for (const piece of pieces) {
        const key = `${piece.name}:${piece.platformId ?? ''}`
        const existing = latest.get(key)
        if (isNil(existing) || isNewerVersion(piece.version, existing.version)) {
            latest.set(key, piece)
        }
    }
    return Array.from(latest.values()).map((p) => p.id)
}

async function findTranslations({ piece, locale }: FindTranslationsParams): Promise<Record<string, string> | undefined> {
    if (locale === LocalesEnum.ENGLISH) {
        return undefined
    }
    const loaded = piece.i18n?.[locale]
    if (!isNil(loaded) || isNil(piece.id)) {
        return loaded
    }
    const translationsById = await fetchTranslationsForLocale({ pieceIds: [piece.id], locale })
    return translationsById.get(piece.id)
}

async function fetchTranslationsForLocale({ pieceIds, locale }: FetchTranslationsForLocaleParams): Promise<Map<string, Record<string, string>>> {
    const translationsByPieceId = new Map<string, Record<string, string>>()
    if (pieceIds.length === 0) {
        return translationsByPieceId
    }
    const rows = await pieceRepos()
        .createQueryBuilder('pm')
        .select('pm."id"', 'id')
        .addSelect('pm."i18n" -> :locale', 'translations')
        .where('pm."id" IN (:...pieceIds)', { pieceIds })
        .setParameter('locale', locale)
        .getRawMany<{ id: string, translations: Record<string, string> | null }>()
    for (const row of rows) {
        if (!isNil(row.translations)) {
            translationsByPieceId.set(row.id, row.translations)
        }
    }
    return translationsByPieceId
}

const inflightFetches = new Map<string, Promise<unknown>>()

function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = inflightFetches.get(key) as Promise<T> | undefined
    if (!isNil(existing)) {
        return existing
    }
    const promise = (async () => {
        try {
            return await fn()
        }
        finally {
            inflightFetches.delete(key)
        }
    })()
    inflightFetches.set(key, promise)
    return promise
}

function filterRegistry(registry: PieceRegistryEntry[], params: { release: string | undefined, platformId: string | undefined }): PieceRegistryEntry[] {
    return registry
        .filter((piece) => filterPieceBasedOnType(params.platformId, piece))
        .filter((piece) => isNil(params.release) || isSupportedRelease(params.release, piece))
}



type ListParams = {
    projectId?: string
    platformId?: string
    includeHidden: boolean
    categories?: PieceCategory[]
    sortBy?: PieceSortBy
    orderBy?: PieceOrderBy
    searchQuery?: string
    suggestionType?: SuggestionType
    locale?: string
    audience?: PieceAudienceFilter
}

type GetOrThrowParams = {
    name: string
    version?: string
    entityManager?: EntityManager
    projectId?: string
    platformId?: string
    locale?: string
    includeTranslations?: boolean
}

type DeleteParams = {
    id: string
    platformId: string
}

type FindFlowsUsingPieceParams = {
    pieceName: string
    platformId: string
    log: FastifyBaseLogger
}

type CreateParams = {
    pieceMetadata: PieceMetadata
    platformId?: string
    projectId?: string
    packageType: PackageType
    pieceType: PieceType
    archiveId?: string
    publishCacheRefresh?: boolean
}

type UpdateUsagesParams = {
    usages: {
        id: string
        usage: number
    }[]
}

type GetExactPieceVersionParams = {
    name: string
    version: string
    platformId: PlatformId
}

type RegistryParams = {
    release: string
    platformId?: string
}

type FetchPieceVersionParams = {
    pieceName: string
    version: string
    platformId?: string
    includeTranslations: boolean
    log: FastifyBaseLogger
}

type ToPieceMetadataModelSummaryParams<T extends PieceMetadataSchema | PieceMetadataModel> = {
    pieces: T[]
    originalPieces: T[]
    suggestionType?: SuggestionType
}

type FillCatalogueParams = {
    locale: LocalesEnum
    log: FastifyBaseLogger
}

type LoadCataloguePiecesParams = {
    log: FastifyBaseLogger
}

type FindTranslationsParams = {
    piece: PieceMetadataModel
    locale: LocalesEnum
}

type FetchTranslationsForLocaleParams = {
    pieceIds: string[]
    locale: LocalesEnum
}

type PieceKey = {
    id: string
    name: string
    version: string
    platformId: string | null
    minimumSupportedRelease?: string
    maximumSupportedRelease?: string
}
