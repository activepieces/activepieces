import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddReadRunPermissionToViewerRole1737562809869 implements MigrationInterface {
    name = 'AddReadRunPermissionToViewerRole1737562809869'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE project_role
            SET permissions = array_append(permissions, 'READ_RUN')
            WHERE LOWER(name) = 'viewer'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE project_role
            SET permissions = array_remove(permissions, 'READ_RUN')
            WHERE LOWER(name) = 'viewer'
        `)
    }

}


