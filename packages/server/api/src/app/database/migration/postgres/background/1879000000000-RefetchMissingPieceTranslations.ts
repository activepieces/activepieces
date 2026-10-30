import { chunk, isObject, sanitizeObjectForPostgresql, tryCatch } from '@activepieces/core-utils'
import { apVersionUtil, safeHttp } from '@activepieces/server-utils'
import { ApEdition, PieceAudienceFilter, PieceSyncMode } from '@activepieces/shared'
import { QueryRunner } from 'typeorm'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { BackgroundMigration } from '../../../background-migration'

export class RefetchMissingPieceTranslations1879000000000 implements BackgroundMigration {
    name = 'RefetchMissingPieceTranslations1879000000000'
    release = '0.93.0'
    transaction = false as const

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (system.getEdition() === ApEdition.CLOUD || system.get(AppSystemProp.PIECES_SYNC_MODE) !== PieceSyncMode.OFFICIAL_AUTO) {
            return
        }
        const missing = await findPiecesMissingTranslations({ queryRunner })
        if (missing.length === 0) {
            return
        }
        const offered = await fetchOfferedVersions()
        const refetchable = missing.filter((piece) => offered.has(versionKey(piece)))
        const outcomes = await chunk(refetchable, BATCH_SIZE).reduce<Promise<RestoreOutcome[]>>(
            async (previous, batch) => [
                ...await previous,
                ...await Promise.all(batch.map((piece) => restoreTranslations({ queryRunner, piece }))),
            ],
            Promise.resolve([]),
        )
        system.globalLogger().info({
            migration: {
                name: this.name,
                missing: missing.length,
                notOffered: missing.length - refetchable.length,
                restored: outcomes.filter((outcome) => outcome === 'restored').length,
                untranslated: outcomes.filter((outcome) => outcome === 'untranslated').length,
                failed: outcomes.filter((outcome) => outcome === 'failed').length,
            },
        }, '[RefetchMissingPieceTranslations] Restored translations for piece versions synced without them')
    }

    public async down(): Promise<void> {
        return
    }
}

async function findPiecesMissingTranslations({ queryRunner }: { queryRunner: QueryRunner }): Promise<MissingPiece[]> {
    const rows: unknown = await queryRunner.query(`
        SELECT pm."id", pm."name", pm."version"
          FROM "piece_metadata" pm
         WHERE pm."pieceType" = 'OFFICIAL'
           AND pm."i18n" IS NULL
           AND NOT EXISTS (SELECT 1 FROM "piece_translation" t WHERE t."pieceMetadataId" = pm."id")
    `)
    return Array.isArray(rows) ? rows.filter(isMissingPiece) : []
}

async function fetchOfferedVersions(): Promise<Set<string>> {
    const params = new URLSearchParams({ edition: system.getEdition(), release: apVersionUtil.getCurrentRelease() })
    const response = await safeHttp.axios.get<unknown>(`${CLOUD_PIECES_URL}/registry?${params.toString()}`, { timeout: REGISTRY_TIMEOUT_MS })
    const pieces = Array.isArray(response.data) ? response.data.filter(isVersionRef) : []
    return new Set(pieces.map(versionKey))
}

async function restoreTranslations({ queryRunner, piece }: RestoreTranslationsParams): Promise<RestoreOutcome> {
    const { data: rows, error } = await tryCatch(async () => {
        const params = new URLSearchParams({ audience: PieceAudienceFilter.ALL, version: piece.version })
        const response = await safeHttp.axios.get<unknown>(`${CLOUD_PIECES_URL}/${piece.name}?${params.toString()}`, { timeout: REGISTRY_TIMEOUT_MS })
        return toTranslationRows({ pieceMetadataId: piece.id, body: response.data })
    })
    if (error) {
        system.globalLogger().warn({ piece: { name: piece.name, version: piece.version }, error: error.message }, '[RefetchMissingPieceTranslations] Could not fetch piece from the registry, leaving it untranslated')
        return 'failed'
    }
    if (rows.length === 0) {
        return 'untranslated'
    }
    await queryRunner.query(`
        INSERT INTO "piece_translation" ("pieceMetadataId", "locale", "translations")
        SELECT row."pieceMetadataId", row."locale", row."translations"
          FROM jsonb_to_recordset($1::jsonb) AS row("pieceMetadataId" varchar, "locale" varchar, "translations" jsonb)
        ON CONFLICT DO NOTHING
    `, [JSON.stringify(rows)])
    return 'restored'
}

function toTranslationRows({ pieceMetadataId, body }: { pieceMetadataId: string, body: unknown }): TranslationRow[] {
    if (!isObject(body) || !('i18n' in body)) {
        return []
    }
    const sanitized = sanitizeObjectForPostgresql(body.i18n)
    if (!isObject(sanitized)) {
        return []
    }
    return Object.entries(sanitized).flatMap(([locale, translations]) =>
        isObject(translations) ? [{ pieceMetadataId, locale, translations }] : [],
    )
}

function versionKey({ name, version }: { name: string, version: string }): string {
    return `${name}@${version}`
}

function isVersionRef(value: unknown): value is { name: string, version: string } {
    return isObject(value) && 'name' in value && typeof value.name === 'string' && 'version' in value && typeof value.version === 'string'
}

function isMissingPiece(value: unknown): value is MissingPiece {
    return isVersionRef(value) && 'id' in value && typeof value.id === 'string'
}

const CLOUD_PIECES_URL = 'https://cloud.activepieces.com/api/v1/pieces'
const BATCH_SIZE = 5
const REGISTRY_TIMEOUT_MS = 30_000

type MissingPiece = {
    id: string
    name: string
    version: string
}

type RestoreOutcome = 'restored' | 'untranslated' | 'failed'

type RestoreTranslationsParams = {
    queryRunner: QueryRunner
    piece: MissingPiece
}

type TranslationRow = {
    pieceMetadataId: string
    locale: string
    translations: object
}
