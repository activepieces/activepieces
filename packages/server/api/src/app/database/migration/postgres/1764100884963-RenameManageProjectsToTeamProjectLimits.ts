import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

export class RenameManageProjectsToTeamProjectLimits1764100884963 implements MigrationInterface {
    name = 'RenameManageProjectsToTeamProjectLimits1764100884963'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        const edition = system.getEdition()
        
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "teamProjectsLimit" character varying
        `)
        
        // Legacy string values of the removed TeamProjectsLimit enum; migration 1798 later reads these.
        const teamProjectsLimitForFalse = edition === ApEdition.CLOUD ? 'ONE' : 'NONE'

        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "teamProjectsLimit" = CASE
                WHEN "manageProjectsEnabled" = true THEN 'UNLIMITED'
                ELSE '${teamProjectsLimitForFalse}'
            END
        `)
        
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "teamProjectsLimit" SET NOT NULL
        `)
        
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "manageProjectsEnabled"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ADD "manageProjectsEnabled" boolean
        `)
        
        await queryRunner.query(`
            UPDATE "platform_plan"
            SET "manageProjectsEnabled" = CASE
                WHEN "teamProjectsLimit" = 'UNLIMITED' THEN true
                ELSE false
            END
        `)
        
        await queryRunner.query(`
            ALTER TABLE "platform_plan"
            ALTER COLUMN "manageProjectsEnabled" SET NOT NULL
        `)
        
        await queryRunner.query(`
            ALTER TABLE "platform_plan" DROP COLUMN "teamProjectsLimit"
        `)
    }
}
