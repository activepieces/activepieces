import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddKnowledgeBaseChunkTable1773627989515 implements MigrationInterface {
    name = 'AddKnowledgeBaseChunkTable1773627989515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddKnowledgeBaseChunkTable1773627989515] up')
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "knowledge_base_file" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "fileId" character varying(21) NOT NULL,
                "displayName" character varying NOT NULL,
                CONSTRAINT "pk_knowledge_base_file" PRIMARY KEY ("id"),
                CONSTRAINT "fk_kb_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_kb_file_file_id" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_kb_file_project_id" ON "knowledge_base_file" ("projectId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_kb_file_file_id" ON "knowledge_base_file" ("fileId")
        `)

        // Check if pgvector is available before creating the chunk table with vector column
        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        log.info('[AddKnowledgeBaseChunkTable1773627989515] vectorAvailable', vectorAvailable)
        if (!vectorAvailable[0]?.available) {
            log.warn('[Migration] Skipping knowledge_base_chunk table creation — pgvector extension is not installed. This migration will be marked as applied. If you install pgvector later, you must run a new migration to create the knowledge_base_chunk table.')
            return
        }
        log.info('[AddKnowledgeBaseChunkTable1773627989515] pgvector is available')
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "knowledge_base_chunk" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "knowledgeBaseFileId" character varying(21) NOT NULL,
                "content" text NOT NULL,
                "chunkIndex" integer NOT NULL,
                "embedding" vector(768),
                "metadata" jsonb,
                CONSTRAINT "pk_knowledge_base_chunk" PRIMARY KEY ("id"),
                CONSTRAINT "fk_kb_chunk_kb_file_id" FOREIGN KEY ("knowledgeBaseFileId") REFERENCES "knowledge_base_file"("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_kb_chunk_project_file" ON "knowledge_base_chunk" ("projectId", "knowledgeBaseFileId")
        `)

        if (!isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_kb_chunk_embedding" ON "knowledge_base_chunk" USING hnsw ("embedding" vector_cosine_ops)
            `)
        }

        log.info('[AddKnowledgeBaseChunkTable1773627989515] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddKnowledgeBaseChunkTable1773627989515] down')
        await queryRunner.query('DROP TABLE IF EXISTS "knowledge_base_chunk"')
        await queryRunner.query('DROP TABLE IF EXISTS "knowledge_base_file"')
        log.info('[AddKnowledgeBaseChunkTable1773627989515] done')
    }
}
