import { ApEdition } from '@activepieces/shared'
import { QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { Migration } from '../../migration'

export class AddChatEnabled1776100000000 implements Migration {
    name = 'AddChatEnabled1776100000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "chatEnabled" boolean
        `)
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "chatEnabled" = true
        `)
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "chatEnabled"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "chatEnabled"
        `)
    }
}
