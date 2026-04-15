import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddCopilotFilesAndCodeChunks1775800000000 implements MigrationInterface {
    name = 'AddCopilotFilesAndCodeChunks1775800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddCopilotFilesAndCodeChunks1775800000000] up')

        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        log.info('[AddCopilotFilesAndCodeChunks1775800000000] vectorAvailable', vectorAvailable)
        if (!vectorAvailable[0]?.available) {
            log.warn('[Migration] Skipping copilot_code_chunks table creation — pgvector extension is not installed. This migration will be marked as applied. If you install pgvector later, you must run a new migration to create the copilot_code_chunks table.')
            return
        }
        log.info('[AddCopilotFilesAndCodeChunks1775800000000] pgvector is available')

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "copilot_code_chunks" (
                "id"              character varying(21) NOT NULL,
                "created"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "path"            text NOT NULL,
                "language"        character varying,
                "content"         text NOT NULL,
                "summary"         text,
                "embedding"       vector(768),
                "embeddingModel"  character varying,
                "startLine"       integer NOT NULL,
                "endLine"         integer NOT NULL,
                "functionName"    character varying,
                "className"       character varying,
                "chunkType"       character varying NOT NULL,
                "tokens"          integer,
                "searchVector"    tsvector,
                CONSTRAINT "pk_copilot_code_chunks" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_path" ON "copilot_code_chunks" ("path")
        `)

        if (!isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_embedding" ON "copilot_code_chunks" USING hnsw ("embedding" vector_cosine_ops)
            `)
        }

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_search_vector" ON "copilot_code_chunks" USING gin ("searchVector")
        `)

        log.info('[AddCopilotFilesAndCodeChunks1775800000000] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddCopilotFilesAndCodeChunks1775800000000] down')
        await queryRunner.query('DROP TABLE IF EXISTS "copilot_code_chunks"')
        log.info('[AddCopilotFilesAndCodeChunks1775800000000] done')
    }
}
