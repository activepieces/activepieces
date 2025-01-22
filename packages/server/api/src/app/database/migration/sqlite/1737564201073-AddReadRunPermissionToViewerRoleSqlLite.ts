import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddReadRunPermissionToViewerRoleSqlLite1737564201073 implements MigrationInterface {
    name = 'AddReadRunPermissionToViewerRoleSqlLite1737564201073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE project_role
            SET permissions = CASE 
                WHEN permissions LIKE '%READ_RUN%' THEN permissions
                ELSE permissions || ',READ_RUN'
            END
            WHERE LOWER(name) = 'viewer'
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE project_role
            SET permissions = TRIM(
                REPLACE(
                    REPLACE(permissions, ',READ_RUN', ''), -- Remove ',READ_RUN' if it's at the end or middle
                    'READ_RUN,', ''                        -- Remove 'READ_RUN,' if it's at the start
                )
            )
            WHERE LOWER(name) = 'viewer'
            AND permissions LIKE '%READ_RUN%'
        `)
    }

}
