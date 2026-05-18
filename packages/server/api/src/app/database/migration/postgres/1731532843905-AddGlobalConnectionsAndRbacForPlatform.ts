import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddGlobalConnectionsAndRbacForPlatform1731532843905 implements MigrationInterface {
    name = 'AddGlobalConnectionsAndRbacForPlatform1731532843905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "globalConnectionsEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "globalConnectionsEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "globalConnectionsEnabled" SET NOT NULL
        `)
        
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "customRolesEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform"
            SET "customRolesEnabled" = false
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ALTER COLUMN "customRolesEnabled" SET NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "scope" DROP DEFAULT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "scope"
            SET DEFAULT 'PROJECT'
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "customRolesEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "globalConnectionsEnabled"
        `)
    }

}
