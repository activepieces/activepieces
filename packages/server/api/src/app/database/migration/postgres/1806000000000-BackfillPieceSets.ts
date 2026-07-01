import { apId } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'
import { Migration } from '../../migration'

// Matches the post-1800 config format: blocklist-only arrays
type PieceSetConfig = {
    disabledPieces: string[]
    disabledActions: Record<string, string[]>
    disabledTriggers: Record<string, string[]>
}

const EMPTY_CONFIG: PieceSetConfig = {
    disabledPieces: [],
    disabledActions: {},
    disabledTriggers: {},
}

const PLATFORM_BATCH = 100
const PROJECT_BATCH = 500

const log = system.globalLogger()

export class BackfillPieceSets1806000000000 implements Migration {
    name = 'BackfillPieceSets1806000000000'
    breaking = false
    release = '0.103.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }

        log.info('[BackfillPieceSets1806000000000#up] Starting piece-set backfill')

        let platformOffset = 0
        let platformCount = 0

        while (true) {
            const platforms: Array<{ id: string }> = await queryRunner.query(
                'SELECT id FROM platform ORDER BY created ASC LIMIT $1 OFFSET $2',
                [PLATFORM_BATCH, platformOffset],
            )
            if (platforms.length === 0) break

            for (const { id: platformId } of platforms) {
                await migratePlatform(queryRunner, platformId)
                platformCount++
            }

            platformOffset += platforms.length
            if (platforms.length < PLATFORM_BATCH) break
        }

        log.info({ platformCount }, '[BackfillPieceSets1806000000000#up] Backfill complete')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }

        // Disassociate all projects from sets created by this migration, then delete those sets.
        // User-created sets (isDefault=false, externalId=null, generatedForProjectId=null) are preserved.
        await queryRunner.query(`
            UPDATE project
            SET "pieceSetId" = NULL
            WHERE "pieceSetId" IN (
                SELECT id FROM piece_set
                WHERE "isDefault" = true
                   OR "externalId" IS NOT NULL
                   OR "generatedForProjectId" IS NOT NULL
            )
        `)

        await queryRunner.query(`
            DELETE FROM piece_set
            WHERE "isDefault" = true
               OR "externalId" IS NOT NULL
               OR "generatedForProjectId" IS NOT NULL
        `)

        log.info('[BackfillPieceSets1806000000000#down] Rolled back piece-set backfill')
    }
}

async function migratePlatform(queryRunner: QueryRunner, platformId: string): Promise<void> {
    // Cache all piece names visible to this platform for the whole platform pass
    const allPieceNames = await fetchAllPieceNamesForPlatform(queryRunner, platformId)

    const defaultSetId = await ensureDefaultSet(queryRunner, platformId)
    await migrateTagSets(queryRunner, platformId, allPieceNames)
    await migrateAllowedProjects(queryRunner, platformId, allPieceNames)
    await assignRemainingProjectsToDefault(queryRunner, platformId, defaultSetId)

    log.info({ platform: { id: platformId } }, '[BackfillPieceSets1806000000000] Platform migrated')
}

// ─── Step 1: Default sets ──────────────────────────────────────────────────────

async function ensureDefaultSet(queryRunner: QueryRunner, platformId: string): Promise<string> {
    const [existing] = await queryRunner.query(
        'SELECT id, "externalId" FROM piece_set WHERE "platformId" = $1 AND "isDefault" = true LIMIT 1',
        [platformId],
    )
    if (existing) {
        // Back-fill externalId on sets created before this field was added
        if (existing.externalId === null || existing.externalId === undefined) {
            await queryRunner.query(
                'UPDATE piece_set SET "externalId" = $1 WHERE id = $2',
                ['default', existing.id],
            )
        }
        return existing.id
    }

    const id = apId()
    await queryRunner.query(
        `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "includeNewPieces", "includeNewActions", "generatedForProjectId", "externalId", config)
         VALUES ($1, NOW(), NOW(), $2, 'Default', true, true, true, NULL, 'default', $3)`,
        [id, platformId, JSON.stringify(EMPTY_CONFIG)],
    )
    return id
}

// ─── Step 2: Tag sets ──────────────────────────────────────────────────────────

async function migrateTagSets(
    queryRunner: QueryRunner,
    platformId: string,
    allPieceNames: string[],
): Promise<void> {
    // Tags that have ≥1 piece and do not yet have a corresponding piece set
    const tags: Array<{ tagId: string, tagName: string }> = await queryRunner.query(
        `SELECT t.id AS "tagId", t.name AS "tagName"
         FROM tag t
         WHERE t."platformId" = $1
           AND EXISTS (
               SELECT 1 FROM piece_tag pt WHERE pt."tagId" = t.id
           )
           AND NOT EXISTS (
               SELECT 1 FROM piece_set ps
               WHERE ps."platformId" = $1 AND ps."externalId" = t.name
           )
         ORDER BY t.created ASC`,
        [platformId],
    )

    if (tags.length === 0) return

    // Batch-fetch all piece→tag mappings for this platform in one query
    const tagIds = tags.map((t) => t.tagId)
    const pieceTags: Array<{ tagId: string, pieceName: string }> = await queryRunner.query(
        `SELECT "tagId", "pieceName" FROM piece_tag
         WHERE "platformId" = $1 AND "tagId" = ANY($2::text[])`,
        [platformId, tagIds],
    )

    // Group pieces by tagId for O(1) lookup
    const piecesByTagId = new Map<string, Set<string>>()
    for (const row of pieceTags) {
        const existing = piecesByTagId.get(row.tagId) ?? new Set<string>()
        existing.add(row.pieceName)
        piecesByTagId.set(row.tagId, existing)
    }

    // Insert one set per tag
    for (const { tagId, tagName } of tags) {
        const taggedPieces = piecesByTagId.get(tagId) ?? new Set<string>()
        const disabledPieces = allPieceNames.filter((name) => !taggedPieces.has(name))

        const config: PieceSetConfig = { disabledPieces, disabledActions: {}, disabledTriggers: {} }
        await queryRunner.query(
            `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "includeNewPieces", "includeNewActions", "generatedForProjectId", "externalId", config)
             VALUES ($1, NOW(), NOW(), $2, $3, false, false, false, NULL, $4, $5)`,
            [apId(), platformId, tagName, tagName, JSON.stringify(config)],
        )
    }
}

// ─── Step 3: Per-project sets for ALLOWED plans ────────────────────────────────

async function migrateAllowedProjects(
    queryRunner: QueryRunner,
    platformId: string,
    allPieceNames: string[],
): Promise<void> {
    let offset = 0

    while (true) {
        // Projects with ALLOWED filter that don't yet have a piece set assigned
        // and haven't already had a generated set created for them
        const projects: Array<{ projectId: string, pieces: string | string[] }> = await queryRunner.query(
            `SELECT p.id AS "projectId", pp.pieces
             FROM project p
             JOIN project_plan pp ON pp."projectId" = p.id
             WHERE p."platformId" = $1
               AND pp."piecesFilterType" = 'ALLOWED'
               AND p."pieceSetId" IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM piece_set ps
                   WHERE ps."generatedForProjectId" = p.id AND ps."platformId" = $1
               )
             ORDER BY p.created ASC
             LIMIT $2 OFFSET $3`,
            [platformId, PROJECT_BATCH, offset],
        )

        if (projects.length === 0) break

        await insertProjectSets(queryRunner, platformId, allPieceNames, projects)

        offset += projects.length
        if (projects.length < PROJECT_BATCH) break
    }
}

async function insertProjectSets(
    queryRunner: QueryRunner,
    platformId: string,
    allPieceNames: string[],
    projects: Array<{ projectId: string, pieces: string | string[] }>,
): Promise<void> {
    // Build all set rows in one INSERT and capture the returned (id, generatedForProjectId) pairs
    const rows: Array<{
        id: string
        projectId: string
        config: PieceSetConfig
        name: string
    }> = projects.map(({ projectId, pieces }) => {
        const allowedPieces = new Set(toStringArray(pieces))
        const disabledPieces = allPieceNames.filter((name) => !allowedPieces.has(name))
        return {
            id: apId(),
            projectId,
            name: `Project (${projectId})`,
            config: { disabledPieces, disabledActions: {}, disabledTriggers: {} },
        }
    })

    if (rows.length === 0) return

    // Build multi-row INSERT
    const valuePlaceholders = rows
        .map((_, i) => {
            const base = i * 5
            return `($${base + 1}, NOW(), NOW(), $${base + 2}, $${base + 3}, false, false, false, $${base + 4}, NULL, $${base + 5})`
        })
        .join(', ')

    const params: unknown[] = rows.flatMap((r) => [r.id, platformId, r.name, r.projectId, JSON.stringify(r.config)])

    await queryRunner.query(
        `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "includeNewPieces", "includeNewActions", "generatedForProjectId", "externalId", config)
         VALUES ${valuePlaceholders}`,
        params,
    )

    // Assign each project to its new set with a single multi-CASE UPDATE
    const caseStatements = rows
        .map((_, i) => {
            const base = i * 2
            return `WHEN $${base + 1} THEN $${base + 2}::character varying`
        })
        .join(' ')

    const projectIds = rows.map((r) => r.projectId)
    const updateParams: unknown[] = rows.flatMap((r) => [r.projectId, r.id])
    updateParams.push(projectIds)

    await queryRunner.query(
        `UPDATE project
         SET "pieceSetId" = CASE id ${caseStatements} END
         WHERE id = ANY($${rows.length * 2 + 1}::text[])`,
        updateParams,
    )
}

// ─── Step 4: Assign remaining to default ────────────────────────────────────────

async function assignRemainingProjectsToDefault(
    queryRunner: QueryRunner,
    platformId: string,
    defaultSetId: string,
): Promise<void> {
    // One shot: all projects still without a pieceSetId (NONE-filter + any missed) → default
    await queryRunner.query(
        `UPDATE project
         SET "pieceSetId" = $1
         WHERE "platformId" = $2
           AND "pieceSetId" IS NULL`,
        [defaultSetId, platformId],
    )
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function fetchAllPieceNamesForPlatform(queryRunner: QueryRunner, platformId: string): Promise<string[]> {
    const rows: Array<{ name: string }> = await queryRunner.query(
        `SELECT DISTINCT name
         FROM piece_metadata
         WHERE "platformId" = $1 OR "platformId" IS NULL
         ORDER BY name ASC`,
        [platformId],
    )
    return rows.map((r) => r.name)
}

// TypeORM returns PostgreSQL text[] as JS arrays or as a Postgres literal like '{a,b}'.
// Handle both to be safe.
function toStringArray(value: string | string[]): string[] {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        // Strip braces and split, handle empty array {}
        const inner = value.replace(/^\{|\}$/g, '').trim()
        if (!inner) return []
        return inner.split(',').map((s) => s.replace(/^"|"$/g, '').trim())
    }
    return []
}
