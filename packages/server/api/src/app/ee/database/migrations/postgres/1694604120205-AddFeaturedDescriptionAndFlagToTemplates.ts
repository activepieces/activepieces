import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddFeaturedDescriptionAndFlagToTemplates1694604120205
implements MigrationInterface {
    name = 'AddFeaturedDescriptionAndFlagToTemplates1694604120205'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "isFeatured" boolean',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "featuredDescription" character varying',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "featuredDescription"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "isFeatured"',
        )
    }
}
