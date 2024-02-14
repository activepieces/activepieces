import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEmbeddingFeatureToPlatform1701794452891
implements MigrationInterface {
    name = 'AddEmbeddingFeatureToPlatform1701794452891'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "embeddingEnabled" boolean NOT NULL DEFAULT true
        `)

        await queryRunner.query(`
            UPDATE "platform"
            SET "embeddingEnabled" = true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "embeddingEnabled"
        `)
    }
}
