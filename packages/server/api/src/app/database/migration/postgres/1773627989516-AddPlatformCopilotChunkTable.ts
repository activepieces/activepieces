import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-props'
import { DatabaseType } from '../../database-type'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)
const isPGlite = databaseType === DatabaseType.PGLITE

export class AddPlatformCopilotChunkTable1773627989516 implements MigrationInterface {
    name = 'AddPlatformCopilotChunkTable1773627989516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddPlatformCopilotChunkTable1773627989516] up')

        const vectorAvailable = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') AS available
        `)
        if (!vectorAvailable[0]?.available) {
            log.warn('[AddPlatformCopilotChunkTable1773627989516] Skipping — pgvector extension not installed.')
            return
        }

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "platform_copilot_chunk" (
                "id"             character varying(21) NOT NULL,
                "created"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId"     character varying(21) NOT NULL,
                "sourceType"     character varying NOT NULL,
                "sourceUrl"      character varying NOT NULL,
                "sourceTitle"    character varying NOT NULL,
                "content"        text NOT NULL,
                "chunkIndex"     integer NOT NULL,
                "embedding"      vector(768),
                "embeddingModel" character varying,
                "metadata"       jsonb,
                CONSTRAINT "pk_platform_copilot_chunk" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_pc_chunk_platform" ON "platform_copilot_chunk" ("platformId")
        `)

        if (!isPGlite) {
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "idx_pc_chunk_embedding"
                ON "platform_copilot_chunk" USING hnsw ("embedding" vector_cosine_ops)
            `)
        }

        log.info('[AddPlatformCopilotChunkTable1773627989516] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddPlatformCopilotChunkTable1773627989516] down')
        await queryRunner.query('DROP TABLE IF EXISTS "platform_copilot_chunk"')
        log.info('[AddPlatformCopilotChunkTable1773627989516] done')
    }
}
