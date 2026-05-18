import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFeaturesToPlatform1714145914415 implements MigrationInterface {
    name = 'AddFeaturesToPlatform1714145914415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await addColumnWithFalse(queryRunner, 'customDomainsEnabled')
        await addColumnWithFalse(queryRunner, 'customAppearanceEnabled')
        await addColumnWithFalse(queryRunner, 'manageProjectsEnabled')
        await addColumnWithFalse(queryRunner, 'managePiecesEnabled')
        await addColumnWithFalse(queryRunner, 'manageTemplatesEnabled')
        await addColumnWithFalse(queryRunner, 'apiKeysEnabled')
        await addColumnWithFalse(queryRunner, 'projectRolesEnabled')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "projectRolesEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "apiKeysEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "manageTemplatesEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "managePiecesEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "manageProjectsEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "customAppearanceEnabled"
        `)
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "customDomainsEnabled"
        `)
    }

}

async function addColumnWithFalse(queryRunner: QueryRunner, feature: string): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "platform"
        ADD "${feature}" boolean
    `)

    await queryRunner.query(`
        UPDATE "platform"
        SET "${feature}" = false
    `)

    await queryRunner.query(`
        ALTER TABLE "platform"
        ALTER COLUMN "${feature}" SET NOT NULL
    `)

}