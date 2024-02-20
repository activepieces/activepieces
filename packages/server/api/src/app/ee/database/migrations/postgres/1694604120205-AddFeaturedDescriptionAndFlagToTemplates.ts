import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFeaturedDescriptionAndFlagToTemplates1694604120205
implements MigrationInterface {
    name = 'AddFeaturedDescriptionAndFlagToTemplates1694604120205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "isFeatured" boolean',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "featuredDescription" character varying',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "featuredDescription"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "isFeatured"',
        )
    }
}
