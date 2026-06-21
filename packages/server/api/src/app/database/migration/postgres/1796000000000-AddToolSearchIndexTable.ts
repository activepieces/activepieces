import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { Migration } from '../../migration'

const log = system.globalLogger()

export class AddToolSearchIndexTable1796000000000 implements Migration {
    name = 'AddToolSearchIndexTable1796000000000'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        if (!vectorAvailable[0]?.available) {
            log.warn('[AddToolSearchIndexTable1796000000000] Skipping tool_search_index table creation — pgvector extension is not installed. The tool-search engine will run on the keyword floor until pgvector is available and a new migration creates the table.')
            return
        }

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tool_search_index" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "objectKind" character varying NOT NULL,
                "pieceName" character varying NOT NULL,
                "pieceVersion" character varying NOT NULL,
                "objectName" character varying NOT NULL,
                "displayName" character varying NOT NULL,
                "retrievalDoc" text NOT NULL,
                "audience" character varying,
                "requiresConnection" boolean NOT NULL DEFAULT false,
                "categories" character varying array,
                "modelVersion" character varying NOT NULL,
                "embeddingInputHash" character varying NOT NULL,
                "embedding" vector,
                "platformId" character varying(21),
                CONSTRAINT "pk_tool_search_index" PRIMARY KEY ("id")
            )
        `)

        // Two partial unique indexes give the same dedupe semantics as a single NULLS NOT DISTINCT
        // index, but without the PG15+ syntax (AP pins Postgres 14 — pgvector/pgvector:0.8.0-pg14 in
        // docker-compose.yml — where NULLS NOT DISTINCT is a syntax error). They are also expressible
        // in the TypeORM entity (synchronize path), so both table-creation paths build the same shape.
        // Shared catalog ("platformId" IS NULL): dedupe official pieces on the object key.
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_tsi_object_shared" ON "tool_search_index"
            ("pieceName", "objectKind", "objectName", "modelVersion") WHERE "platformId" IS NULL
        `)
        // Tenant custom pieces ("platformId" set): dedupe within a platform.
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_tsi_object_tenant" ON "tool_search_index"
            ("pieceName", "objectKind", "objectName", "platformId", "modelVersion") WHERE "platformId" IS NOT NULL
        `)

        // B-tree to pre-narrow the exact cosine scan under filters. NO ANN/HNSW index at ~6k rows.
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_tsi_filters" ON "tool_search_index"
            ("objectKind", "platformId", "audience", "requiresConnection")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "tool_search_index"')
    }
}
