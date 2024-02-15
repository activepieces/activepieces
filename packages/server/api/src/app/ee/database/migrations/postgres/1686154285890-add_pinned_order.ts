import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPinnedOrder1686154285890 implements MigrationInterface {
    name = 'AddPinnedOrder1686154285890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_template" DROP COLUMN "pinned"')
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinnedOrder" integer',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "blogUrl" DROP NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_template" ALTER COLUMN "blogUrl" SET NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "pinnedOrder"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinned" boolean NOT NULL',
        )
    }
}
