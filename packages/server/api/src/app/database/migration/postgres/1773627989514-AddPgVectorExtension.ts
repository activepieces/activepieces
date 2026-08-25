import { MigrationInterface } from 'typeorm'

export class AddPgVectorExtension1773627989514 implements MigrationInterface {
    name = 'AddPgVectorExtension1773627989514'

    // No-op: the privileged `CREATE EXTENSION vector` moved to the knowledge base seed
    // (knowledgeBaseSchema.ensure), which runs every boot and skips safely instead of
    // crash-looping when the extension is unavailable or cannot be created.
    public async up(): Promise<void> {}

    public async down(): Promise<void> {}
}
