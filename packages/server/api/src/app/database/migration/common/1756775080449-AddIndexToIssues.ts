import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndexToIssues1756775080449 implements MigrationInterface {
    name = 'AddIndexToIssues1756775080449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_issue_projectId_status_updated" ON "issue" ("projectId", "status", "updated")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_issue_projectId_status_updated"
        `)
    }

}
