import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

const log = system.globalLogger()

export class CascadeProjectDeleteToActivity1710720610670 implements MigrationInterface {
    name = 'CascadeProjectDeleteToActivity1710720610670'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "activity" DROP CONSTRAINT "fk_activity_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "activity"
            ADD CONSTRAINT "fk_activity_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id")
                ON DELETE CASCADE ON UPDATE RESTRICT
        `)

        log.info({ name: this.name }, 'up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "activity" DROP CONSTRAINT "fk_activity_project_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "activity"
            ADD CONSTRAINT "fk_activity_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id")
                ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
        log.info({ name: this.name }, 'down')
    }
}
