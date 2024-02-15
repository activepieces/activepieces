import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

export class AlterTableStoreEntry1707922368189 implements MigrationInterface {
    name = 'AlterTableStoreEntity1707922368189'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('initializeSchema1707922368189: started')

        await queryRunner.query('ALTER TABLE "store-entry" ADD CONSTRAINT uq_projectid_and_key UNIQUE ("projectId", "key");')

        logger.info('initializeSchema1707922368189: completed')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "store-entry" DROP CONSTRAINT uq_projectid_and_key;')
    }
}