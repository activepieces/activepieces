import { apId } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { isNotOneOfTheseEditions } from '../../database-common'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

type PieceSetConfig = {
    pieces: { mode: 'include_all' | 'exclude_all', exceptions: string[] }
    selectedActions: Record<string, string[]>
    selectedTriggers: Record<string, string[]>
}

const DEFAULT_CONFIG: PieceSetConfig = {
    pieces: { mode: 'include_all', exceptions: [] },
    selectedActions: {},
    selectedTriggers: {},
}

const PLATFORM_BATCH = 100
const PROJECT_BATCH = 500

const log = system.globalLogger()
const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class CreatePieceSetTable1804000000000 implements Migration {
    name = 'CreatePieceSetTable1804000000000'
    breaking = false
    release = '0.103.0'
    transaction = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "filteredActionNames" jsonb NOT NULL DEFAULT '{}'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD COLUMN IF NOT EXISTS "filteredTriggerNames" jsonb NOT NULL DEFAULT '{}'
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "piece_set" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "externalId" character varying,
                "isDefault" boolean NOT NULL DEFAULT false,
                "generatedForProjectId" character varying(21),
                "config" jsonb NOT NULL DEFAULT '{"pieces":{"mode":"include_all","exceptions":[]},"selectedActions":{},"selectedTriggers":{}}',
                CONSTRAINT "pk_piece_set" PRIMARY KEY ("id"),
                CONSTRAINT "fk_piece_set_platform_id" FOREIGN KEY ("platformId")
                    REFERENCES "platform"("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_piece_set_platform_id"
            ON "piece_set" ("platformId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_piece_set_platform_id_is_default"
            ON "piece_set" ("platformId")
            WHERE "isDefault" = true
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_piece_set_platform_id_external_id"
            ON "piece_set" ("platformId", "externalId")
            WHERE "externalId" IS NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "pieceSetId" character varying(21)
        `)

        const [existingFk] = await queryRunner.query(
            'SELECT 1 FROM pg_constraint WHERE conname = $1',
            ['fk_project_piece_set_id'],
        )
        if (!existingFk) {
            await queryRunner.query(`
                ALTER TABLE "project"
                ADD CONSTRAINT "fk_project_piece_set_id"
                FOREIGN KEY ("pieceSetId") REFERENCES "piece_set"("id") ON DELETE SET NULL
            `)
        }

        if (isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_project_piece_set_id"
                ON "project" ("pieceSetId")
            `)
        }
        else {
            // CONCURRENTLY avoids a ShareLock that would block all writes on the
            // existing "project" table for the duration of the index build.
            await queryRunner.query(`
                CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_project_piece_set_id"
                ON "project" ("pieceSetId")
            `)
        }

        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }

        log.info('[CreatePieceSetTable1804000000000#up] Starting piece-set backfill')

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

        log.info({ platformCount }, '[CreatePieceSetTable1804000000000#up] Backfill complete')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_project_piece_set_id"')
        await queryRunner.query('ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "fk_project_piece_set_id"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN IF EXISTS "pieceSetId"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id_external_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id_is_default"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id"')
        await queryRunner.query('DROP TABLE IF EXISTS "piece_set"')

        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "filteredTriggerNames"')
        await queryRunner.query('ALTER TABLE "platform" DROP COLUMN IF EXISTS "filteredActionNames"')
    }
}

async function migratePlatform(queryRunner: QueryRunner, platformId: string): Promise<void> {
    const defaultSetId = await ensureDefaultSet(queryRunner, platformId)
    await migrateTagSets(queryRunner, platformId)
    await migrateAllowedProjects(queryRunner, platformId)
    await assignRemainingProjectsToDefault(queryRunner, platformId, defaultSetId)

    log.info({ platform: { id: platformId } }, '[CreatePieceSetTable1804000000000] Platform migrated')
}

async function ensureDefaultSet(queryRunner: QueryRunner, platformId: string): Promise<string> {
    const [existing] = await queryRunner.query(
        'SELECT id FROM piece_set WHERE "platformId" = $1 AND "isDefault" = true LIMIT 1',
        [platformId],
    )
    if (existing) {
        return existing.id
    }

    const id = apId()
    await queryRunner.query(
        `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "generatedForProjectId", "externalId", config)
         VALUES ($1, NOW(), NOW(), $2, 'Default', true, NULL, 'default', $3)`,
        [id, platformId, JSON.stringify(DEFAULT_CONFIG)],
    )
    return id
}

async function migrateTagSets(queryRunner: QueryRunner, platformId: string): Promise<void> {
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

    const tagIds = tags.map((t) => t.tagId)
    const pieceTags: Array<{ tagId: string, pieceName: string }> = await queryRunner.query(
        `SELECT "tagId", "pieceName" FROM piece_tag
         WHERE "platformId" = $1 AND "tagId" = ANY($2::text[])`,
        [platformId, tagIds],
    )

    const piecesByTagId = new Map<string, Set<string>>()
    for (const row of pieceTags) {
        const existing = piecesByTagId.get(row.tagId) ?? new Set<string>()
        existing.add(row.pieceName)
        piecesByTagId.set(row.tagId, existing)
    }

    for (const { tagId, tagName } of tags) {
        const taggedPieces = [...(piecesByTagId.get(tagId) ?? new Set<string>())]
        await queryRunner.query(
            `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "generatedForProjectId", "externalId", config)
             VALUES ($1, NOW(), NOW(), $2, $3, false, NULL, $4, $5)`,
            [apId(), platformId, tagName, tagName, JSON.stringify(allowListConfig(taggedPieces))],
        )
    }
}

async function migrateAllowedProjects(queryRunner: QueryRunner, platformId: string): Promise<void> {
    let offset = 0

    while (true) {
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

        await insertProjectSets(queryRunner, platformId, projects)

        offset += projects.length
        if (projects.length < PROJECT_BATCH) break
    }
}

async function insertProjectSets(
    queryRunner: QueryRunner,
    platformId: string,
    projects: Array<{ projectId: string, pieces: string | string[] }>,
): Promise<void> {
    const rows = projects.map(({ projectId, pieces }) => ({
        id: apId(),
        projectId,
        name: `Project (${projectId})`,
        config: allowListConfig(toStringArray(pieces)),
    }))

    if (rows.length === 0) return

    const valuePlaceholders = rows
        .map((_, i) => {
            const base = i * 5
            return `($${base + 1}, NOW(), NOW(), $${base + 2}, $${base + 3}, false, $${base + 4}, NULL, $${base + 5})`
        })
        .join(', ')

    const params: unknown[] = rows.flatMap((r) => [r.id, platformId, r.name, r.projectId, JSON.stringify(r.config)])

    await queryRunner.query(
        `INSERT INTO piece_set (id, created, updated, "platformId", name, "isDefault", "generatedForProjectId", "externalId", config)
         VALUES ${valuePlaceholders}`,
        params,
    )

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

async function assignRemainingProjectsToDefault(
    queryRunner: QueryRunner,
    platformId: string,
    defaultSetId: string,
): Promise<void> {
    await queryRunner.query(
        `UPDATE project
         SET "pieceSetId" = $1
         WHERE "platformId" = $2
           AND "pieceSetId" IS NULL`,
        [defaultSetId, platformId],
    )
}

function allowListConfig(exceptions: string[]): PieceSetConfig {
    return {
        pieces: { mode: 'exclude_all', exceptions },
        selectedActions: {},
        selectedTriggers: {},
    }
}

// TypeORM returns PostgreSQL text[] as JS arrays or as a Postgres literal like '{a,b}'.
function toStringArray(value: string | string[]): string[] {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
        const inner = value.replace(/^\{|\}$/g, '').trim()
        if (!inner) return []
        return inner.split(',').map((s) => s.replace(/^"|"$/g, '').trim())
    }
    return []
}
