import { MigrationInterface, QueryRunner } from "typeorm";

const OPERATOR_ROLE_ID = '3Wl9IAw5aM0HLafHgMYkb';

export class RemoveOperatorRole1769613456917 implements MigrationInterface {
    name = 'RemoveOperatorRole1769613456917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const usedRole = await queryRunner.query(`
            SELECT pm."platformId"
            FROM "project_member" pm
            WHERE pm."projectRoleId" = $1
            LIMIT 1
        `, [OPERATOR_ROLE_ID]);

        if (usedRole.length > 0) {
            const platformId = usedRole[0].platformId;
            await queryRunner.query(`
                UPDATE "project_role"
                SET "type" = 'CUSTOM', "platformId" = $1
                WHERE "id" = $2
            `, [platformId, OPERATOR_ROLE_ID]);
        } else {
            await queryRunner.query(`
                DELETE FROM "project_role"
                WHERE "id" = $1
            `, [OPERATOR_ROLE_ID]);
        }
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {

    }

}
