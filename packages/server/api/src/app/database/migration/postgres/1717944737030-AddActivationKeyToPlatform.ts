import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddActivationKeyToPlatform1717944737030 implements MigrationInterface {
    name = 'AddActivationKeyToPlatform1717944737030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "activationKey" character varying
        `)
  
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "activationKey"
        `)
    }

}
