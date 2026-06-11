import { tryCatch } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { transaction } from '../core/db/transaction'
import { databaseConnection } from '../database/database-connection'
import { DatabaseType } from '../database/database-type'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

async function isVectorExtensionInstalled(): Promise<boolean> {
    const { data } = await tryCatch(() => databaseConnection().query(
        'SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = $1) AS installed',
        ['vector'],
    ))
    return data?.[0]?.installed === true
}

export const knowledgeBaseSchema = {
    isVectorExtensionInstalled,

    async ensure(log: FastifyBaseLogger): Promise<void> {
        const { error } = await tryCatch(() => transaction(async (entityManager) => {
            const installed = await entityManager.query('SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = $1) AS installed', ['vector'])
            if (installed[0]?.installed !== true) {
                const available = await entityManager.query('SELECT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = $1) AS available', ['vector'])
                if (available[0]?.available !== true) {
                    return
                }
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
            await entityManager.query('CREATE INDEX IF NOT EXISTS "idx_kb_chunk_project_file" ON "knowledge_base_chunk" ("projectId", "knowledgeBaseFileId")')
            if (!isPGlite) {
                await entityManager.query('CREATE INDEX IF NOT EXISTS "idx_kb_chunk_embedding" ON "knowledge_base_chunk" USING hnsw ("embedding" vector_cosine_ops)')
            }
        }))
        if (error) {
            log.warn(`[knowledgeBaseSchema] pgvector setup skipped — knowledge base disabled: ${error.message}`)
        }
    },
}
