import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddKnowledgeBaseChunkTable1773627989515 implements MigrationInterface {
    name = 'AddKnowledgeBaseChunkTable1773627989515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "knowledge_base_file" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "fileId" character varying(21) NOT NULL,
                "displayName" character varying NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "error" character varying,
                "chunkCount" integer NOT NULL DEFAULT 0,
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
        if (!vectorAvailable[0]?.available) {
            console.warn('[Migration] Skipping knowledge_base_chunk table creation — pgvector extension is not installed.')
            return
        }

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "knowledge_base_chunk" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "projectId" character varying(21) NOT NULL,
                "knowledgeBaseFileId" character varying(21) NOT NULL,
                "content" text NOT NULL,
                "chunkIndex" integer NOT NULL,
                "embedding" vector(1536) NOT NULL,
                "metadata" jsonb,
                CONSTRAINT "pk_knowledge_base_chunk" PRIMARY KEY ("id"),
                CONSTRAINT "fk_kb_chunk_kb_file_id" FOREIGN KEY ("knowledgeBaseFileId") REFERENCES "knowledge_base_file"("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_kb_chunk_project_file" ON "knowledge_base_chunk" ("projectId", "knowledgeBaseFileId")
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_kb_chunk_embedding" ON "knowledge_base_chunk" USING hnsw ("embedding" vector_cosine_ops)
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_base_chunk"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_base_file"`)
    }
}
