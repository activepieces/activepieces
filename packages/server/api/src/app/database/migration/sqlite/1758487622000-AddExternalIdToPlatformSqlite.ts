import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalIdToPlatformSqlite1758487622000 implements MigrationInterface {
    name = 'AddExternalIdToPlatformSqlite1758487622000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" 
            ADD COLUMN "externalId" varchar
        `)
        
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_platform_external_id" 
            ON "platform" ("externalId") 
            WHERE "externalId" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "idx_platform_external_id"`)
        await queryRunner.query(`ALTER TABLE "platform" DROP COLUMN "externalId"`)
    }
}
