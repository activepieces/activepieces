import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddActivationKeyToPlatform1717674020379 implements MigrationInterface {
    name = 'AddActivationKeyToPlatform1717674020379'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "premiumPieces" character varying array NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "activationKey" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "activationKey"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "premiumPieces"
        `)
    }

}
