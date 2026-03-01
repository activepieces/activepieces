import { MigrationInterface, QueryRunner } from 'typeorm'

export class RenameApprovalUrlToResolveUrl1742991137557 implements MigrationInterface {
    name = 'RenameApprovalUrlToResolveUrl1742991137557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "approvalUrl" TO "resolveUrl"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "todo"
                RENAME COLUMN "resolveUrl" TO "approvalUrl"
        `)
    }

}
