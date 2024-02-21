import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDisplayNameToSigningKey1698698190965
implements MigrationInterface {
    name = 'AddDisplayNameToSigningKey1698698190965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD "displayName" character varying NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP COLUMN "displayName"
        `)
    }
}
