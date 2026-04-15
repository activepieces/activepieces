import { QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'
import { Migration } from '../../migration'

const log = system.globalLogger()
const isPGlite = system.get(AppSystemProp.DB_TYPE) === DatabaseType.PGLITE

export class AddCopilotCodeChunksTable1776200000000 implements Migration {
    name = 'AddCopilotCodeChunksTable1776200000000'
    breaking = false
    release = '0.81.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddCopilotCodeChunksTable1776200000000] up')

        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        if (!vectorAvailable[0]?.available) {
            log.warn('[AddCopilotCodeChunksTable1776200000000] pgvector not installed, skipping')
            return
        }

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

        log.info('[AddCopilotCodeChunksTable1776200000000] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "copilot_code_chunks"')
    }
}
