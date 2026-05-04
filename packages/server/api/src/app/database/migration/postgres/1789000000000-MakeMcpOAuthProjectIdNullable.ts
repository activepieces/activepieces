import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class MakeMcpOAuthProjectIdNullable1789000000000 implements Migration {
    name = 'MakeMcpOAuthProjectIdNullable1789000000000'
    breaking = false

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "mcp_oauth_authorization_code" ALTER COLUMN "projectId" DROP NOT NULL')
        await queryRunner.query('ALTER TABLE "mcp_oauth_token" ALTER COLUMN "projectId" DROP NOT NULL')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DELETE FROM "mcp_oauth_token" WHERE "projectId" IS NULL')
        await queryRunner.query('DELETE FROM "mcp_oauth_authorization_code" WHERE "projectId" IS NULL')
        await queryRunner.query('ALTER TABLE "mcp_oauth_authorization_code" ALTER COLUMN "projectId" SET NOT NULL')
        await queryRunner.query('ALTER TABLE "mcp_oauth_token" ALTER COLUMN "projectId" SET NOT NULL')
    }
}
