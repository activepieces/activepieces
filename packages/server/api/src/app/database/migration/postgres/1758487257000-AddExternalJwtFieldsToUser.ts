import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddExternalJwtFieldsToUser1758487257000 implements MigrationInterface {
    name = 'AddExternalJwtFieldsToUser1758487257000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "externalIss" character varying
        `)
        
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "externalSub" character varying
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_external_iss_sub" ON "user" ("externalIss", "externalSub")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_user_external_iss_sub"
        `)
        
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "externalSub"
        `)
        
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "externalIss"
        `)
    }
}
