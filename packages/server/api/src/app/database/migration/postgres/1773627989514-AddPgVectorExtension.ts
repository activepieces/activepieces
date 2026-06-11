import { MigrationInterface } from 'typeorm'

export class AddPgVectorExtension1773627989514 implements MigrationInterface {
    name = 'AddPgVectorExtension1773627989514'

    // No-op: the privileged `CREATE EXTENSION vector` moved to the EnableKnowledgeBaseVector
    // conditional migration, which retries safely instead of crash-looping on permission denied.
    public async up(): Promise<void> {}

    public async down(): Promise<void> {}
}
