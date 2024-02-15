import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddVerifiedAndChangeStatus1703769034497
implements MigrationInterface {
    name = 'AddVerifiedAndChangeStatus1703769034497'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "verified" boolean
        `)
        await queryRunner.query(`
            UPDATE "user"
            SET "verified" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "verified" SET NOT NULL
        `)

        await queryRunner.query(`
            UPDATE "user"
            SET "verified" = true
            WHERE "status" = 'VERIFIED'
        `)

        await queryRunner.query(`
            UPDATE "user"
            SET "status" = 'ACTIVE'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "user"
            SET "status" = 'VERIFIED'
            WHERE "verified" = true
        `)

        await queryRunner.query(`
            UPDATE "user"
            SET "status" = 'CREATED'
            WHERE "verified" = false
        `)

        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "verified" DROP NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "user"
            DROP COLUMN "verified"
        `)
    }
}
