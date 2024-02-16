import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPinnedAndBlogUrlToTemplates1686133672743
implements MigrationInterface {
    name = 'AddPinnedAndBlogUrlToTemplates1686133672743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinned" boolean NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "blogUrl" character varying NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "blogUrl"',
        )
        await queryRunner.query('ALTER TABLE "flow_template" DROP COLUMN "pinned"')
    }
}
