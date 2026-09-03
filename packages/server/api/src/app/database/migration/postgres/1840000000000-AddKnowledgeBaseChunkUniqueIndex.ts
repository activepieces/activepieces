import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class AddKnowledgeBaseChunkUniqueIndex1840000000000 implements MigrationInterface {
    name = 'AddKnowledgeBaseChunkUniqueIndex1840000000000'
    breaking = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddKnowledgeBaseChunkUniqueIndex1840000000000] up')
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_base_chunk') AS present
        `)
        if (tableExists[0]?.present !== true) {
            log.info('[AddKnowledgeBaseChunkUniqueIndex1840000000000] no chunk table, nothing to do')
            return
        }
        await queryRunner.query(`
            DELETE FROM "knowledge_base_chunk" AS older
            USING "knowledge_base_chunk" AS newer
            WHERE older."knowledgeBaseFileId" = newer."knowledgeBaseFileId"
              AND older."chunkIndex" = newer."chunkIndex"
              AND (older.created < newer.created
                OR (older.created = newer.created AND older.id < newer.id))
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_kb_chunk_file_index" ON "knowledge_base_chunk" ("knowledgeBaseFileId", "chunkIndex")
        `)
        log.info('[AddKnowledgeBaseChunkUniqueIndex1840000000000] done')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('[AddKnowledgeBaseChunkUniqueIndex1840000000000] down')
        await queryRunner.query('DROP INDEX IF EXISTS "uq_kb_chunk_file_index"')
    }
}
