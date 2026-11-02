import { isNil, LocalesEnum, sanitizeObjectForPostgresql } from '@activepieces/core-utils'
import { I18nForPiece } from '@activepieces/pieces-framework'
import { EntityManager } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { PieceMetadataEntity } from './piece-metadata-entity'
import { PieceTranslationEntity, PieceTranslationSchema } from './piece-translation-entity'

const pieceTranslationRepos = repoFactory(PieceTranslationEntity)

export const pieceTranslationService = {
    async save({ pieceMetadataId, i18n, entityManager }: SaveParams): Promise<void> {
        const rows = toRows({ pieceMetadataId, i18n })
        if (rows.length > 0) {
            await pieceTranslationRepos(entityManager).insert(rows)
        }
    },

    async getForLocale({ pieceIds, locale }: GetForLocaleParams): Promise<Map<string, Record<string, string>>> {
        if (pieceIds.length === 0) {
            return new Map()
        }
        const rows = await pieceTranslationRepos().manager
            .createQueryBuilder(PieceMetadataEntity, 'pm')
            .leftJoin(TABLE, 'pt', 'pt."pieceMetadataId" = pm."id" AND pt."locale" = :locale')
            .select('pm."id"', 'id')
            .addSelect(TRANSLATIONS_WITH_LEGACY_FALLBACK, 'translations')
            .where('pm."id" IN (:...pieceIds)', { pieceIds })
            .setParameter('locale', locale)
            .getRawMany<{ id: string, translations: Record<string, string> | null }>()
        return new Map(rows.flatMap((row) => isNil(row.translations) ? [] : [[row.id, row.translations]]))
    },

    async getAllLocales({ pieceMetadataId }: GetAllLocalesParams): Promise<I18nForPiece | undefined> {
        const row = await pieceTranslationRepos().manager
            .createQueryBuilder(PieceMetadataEntity, 'pm')
            .leftJoin(TABLE, 'pt', 'pt."pieceMetadataId" = pm."id"')
            .select(ALL_TRANSLATIONS_WITH_LEGACY_FALLBACK, 'i18n')
            .where('pm."id" = :pieceMetadataId', { pieceMetadataId })
            .groupBy('pm."id"')
            .getRawOne<{ i18n: I18nForPiece | null }>()
        return row?.i18n ?? undefined
    },
}

function toRows({ pieceMetadataId, i18n }: Pick<SaveParams, 'pieceMetadataId' | 'i18n'>): PieceTranslationSchema[] {
    return Object.entries(sanitizeObjectForPostgresql(i18n ?? {})).flatMap(([locale, translations]) =>
        isNil(translations) ? [] : [{ pieceMetadataId, locale, translations }],
    )
}

const TABLE = PieceTranslationEntity.options.name
const TRANSLATIONS_WITH_LEGACY_FALLBACK = `COALESCE(
    pt."translations"::json,
    CASE WHEN NOT EXISTS (SELECT 1 FROM "${TABLE}" stored WHERE stored."pieceMetadataId" = pm."id") THEN pm."i18n" -> :locale END
)`

const ALL_TRANSLATIONS_WITH_LEGACY_FALLBACK = `COALESCE(
    json_object_agg(pt."locale", pt."translations") FILTER (WHERE pt."locale" IS NOT NULL),
    CASE WHEN NOT EXISTS (SELECT 1 FROM "${TABLE}" stored WHERE stored."pieceMetadataId" = pm."id") THEN pm."i18n" END
)`

type SaveParams = {
    pieceMetadataId: string
    i18n: I18nForPiece
    entityManager: EntityManager
}

type GetForLocaleParams = {
    pieceIds: string[]
    locale: LocalesEnum
}

type GetAllLocalesParams = {
    pieceMetadataId: string
}
