import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class UpdateUserStatusRenameShadowToInvited1699818680567
implements MigrationInterface {
    name = 'UpdateUserStatusRenameShadowToInvited1699818680567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "user"
            SET "status" = 'INVITED'
            WHERE "status" = 'SHADOW'
        `)

        log.info('UpdateUserStatusRenameShadowToInvited1699818680567 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "user"
            SET "status" = 'SHADOW'
            WHERE "status" = 'INVITED'
        `)

        log.info('UpdateUserStatusRenameShadowToInvited1699818680567 down')
    }
}
