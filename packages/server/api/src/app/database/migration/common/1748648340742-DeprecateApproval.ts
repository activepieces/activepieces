import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class DeprecateApproval1748648340742 implements MigrationInterface {
    name = 'DeprecateApproval1748648340742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const log = system.globalLogger()
        log.info({
            name: this.name,
        }, 'up')
        await queryRunner.query(`
            UPDATE piece_metadata SET "maximumSupportedRelease" = '0.57.9' WHERE "name" = '@activepieces/piece-approval'
        `)
        log.info({
            name: this.name,
        }, 'down')
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // do nothing
    }

}
