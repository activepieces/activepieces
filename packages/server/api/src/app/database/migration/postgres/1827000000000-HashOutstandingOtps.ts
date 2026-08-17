import { OtpType } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { encryptUtils } from '../../../helper/encryption'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

const LIFETIME_MS: Record<OtpType, number> = {
    [OtpType.EMAIL_VERIFICATION]: 24 * 60 * 60 * 1000,
    [OtpType.PASSWORD_RESET]: 10 * 60 * 1000,
    [OtpType.EMAIL_LOGIN]: 10 * 60 * 1000,
}

export class HashOutstandingOtps1827000000000 implements MigrationInterface {
    name = 'HashOutstandingOtps1827000000000'
    breaking = false
    release = '0.88.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const removed = await Promise.all(
            Object.entries(LIFETIME_MS).map(async ([type, lifetimeMs]) => {
                const cutoff = new Date(Date.now() - lifetimeMs).toISOString()
                const result = await queryRunner.query(
                    'DELETE FROM "otp" WHERE "type" = $1 AND "updated" < $2',
                    [type, cutoff],
                )
                return { type, deleted: result?.[1] ?? 0 }
            }),
        )

        const outstanding: { id: string, value: string }[] = await queryRunner.query('SELECT "id", "value" FROM "otp"')
        for (const otp of outstanding) {
            await queryRunner.query('UPDATE "otp" SET "value" = $1 WHERE "id" = $2', [
                await encryptUtils.hmacString(otp.value),
                otp.id,
            ])
        }

        log.info({ name: this.name, removed, hashed: outstanding.length }, 'expired codes cleared, outstanding codes hashed in place')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const result = await queryRunner.query('DELETE FROM "otp"')
        log.info({ name: this.name, result }, 'cleared codes that can no longer be read back')
    }
}
