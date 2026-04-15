import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class RecreateCopilotCodeChunks1775800000001 implements MigrationInterface {
    name = 'RecreateCopilotCodeChunks1775800000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[RecreateCopilotCodeChunks] up — dropping old tables and recreating')

        await queryRunner.query('DROP TABLE IF EXISTS "copilot_code_chunks"')
        await queryRunner.query('DROP TABLE IF EXISTS "copilot_files"')

        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        if (!vectorAvailable[0]?.available) {
            log.warn('[RecreateCopilotCodeChunks] pgvector not installed, skipping')
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

        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_path" ON "copilot_code_chunks" ("path")')

        if (!isPGlite) {
            await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_embedding" ON "copilot_code_chunks" USING hnsw ("embedding" vector_cosine_ops)')
        }

        await queryRunner.query('CREATE INDEX IF NOT EXISTS "idx_copilot_code_chunks_search_vector" ON "copilot_code_chunks" USING gin ("searchVector")')

        log.info('[RecreateCopilotCodeChunks] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "copilot_code_chunks"')
    }
}
