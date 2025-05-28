import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProjectRoleToInvitation1745906425212 implements MigrationInterface {
    name = 'AddProjectRoleToInvitation1745906425212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation"
            ADD "projectRole" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_invitation" DROP COLUMN "projectRole"
        `);
    }
}
