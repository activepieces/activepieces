import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { Migration } from '../../migration'

const log = system.globalLogger()

export class AddToolSearchIndexTable1796000000000 implements Migration {
    name = 'AddToolSearchIndexTable1796000000000'
    breaking = false
    release = '0.86.0'

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

        // NULLS NOT DISTINCT so shared-catalog rows ("platformId" IS NULL) still dedupe on the
        // object key — without it Postgres treats every NULL as distinct and the reindex
        // upsert's ON CONFLICT would never fire for official pieces, producing duplicates.
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_tsi_object" ON "tool_search_index"
            ("pieceName", "objectKind", "objectName", "platformId", "modelVersion") NULLS NOT DISTINCT
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
