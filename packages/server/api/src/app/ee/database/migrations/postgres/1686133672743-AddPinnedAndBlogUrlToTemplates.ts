import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'

export class AddPinnedAndBlogUrlToTemplates1686133672743
implements MigrationInterface {
    name = 'AddPinnedAndBlogUrlToTemplates1686133672743'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "pinned" boolean NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_template" ADD "blogUrl" character varying NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.ENTERPRISE, ApEdition.CLOUD])) {
            return
        }
        await queryRunner.query(
            'ALTER TABLE "flow_template" DROP COLUMN "blogUrl"',
        )
        await queryRunner.query('ALTER TABLE "flow_template" DROP COLUMN "pinned"')
    }
}
