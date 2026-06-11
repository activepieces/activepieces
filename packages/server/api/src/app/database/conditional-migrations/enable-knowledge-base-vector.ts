import { EntityManager } from 'typeorm'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { DatabaseType } from '../database-type'
import { ConditionalMigration } from '.'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export const enableKnowledgeBaseVector: ConditionalMigration = {
    name: 'EnableKnowledgeBaseVector',
    up: ensureKnowledgeBaseVectorSchema,
}

async function ensureKnowledgeBaseVectorSchema(entityManager: EntityManager): Promise<void> {
    const installed = await entityManager.query(
        'SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = $1) AS installed',
        ['vector'],
    )
    if (installed[0]?.installed !== true) {
        const available = await entityManager.query(
            'SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = $1) AS available',
            ['vector'],
        )
        if (available[0]?.available !== true) {
            throw new Error('pgvector extension is not available on this PostgreSQL server')
        }
        // Throws "permission denied to create extension" on locked-down Postgres, rolling back the
        // transaction so this stays unrecorded and is retried on the next startup — once a DBA
        // installs the extension it succeeds and is recorded.
        await entityManager.query('CREATE EXTENSION IF NOT EXISTS "vector"')
    }

    await entityManager.query(`
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
    await entityManager.query(`
        CREATE INDEX IF NOT EXISTS "idx_kb_chunk_project_file" ON "knowledge_base_chunk" ("projectId", "knowledgeBaseFileId")
    `)
    if (!isPGlite) {
        await entityManager.query(`
            CREATE INDEX IF NOT EXISTS "idx_kb_chunk_embedding" ON "knowledge_base_chunk" USING hnsw ("embedding" vector_cosine_ops)
        `)
    }
}
