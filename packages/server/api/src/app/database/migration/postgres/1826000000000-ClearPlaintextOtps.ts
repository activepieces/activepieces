import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class ClearPlaintextOtps1826000000000 implements MigrationInterface {
    name = 'ClearPlaintextOtps1826000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // One-time codes are now stored as a keyed digest. A stored plaintext and a stored
        // digest are both just strings, so there is no way to tell them apart at verify time —
        // any row written before this point would silently never match again. Clearing the
        // table is the honest migration: every code is short-lived, so the cost is that a
        // person mid-sign-in requests a fresh one.
        const result = await queryRunner.query('DELETE FROM "otp"')
        log.info({ name: this.name, result }, 'cleared one-time codes written before hashing')
    }

    public async down(): Promise<void> {
        // Nothing to restore — the rows held credentials that are gone by design.
    }
}
