import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUniqueStoreConstrain1708455034835 implements MigrationInterface {
    name = 'AddUniqueStoreConstrain1708455034835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "store-entry"
            ADD CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d" UNIQUE ("projectId", "key")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "store-entry" DROP CONSTRAINT "UQ_6f251cc141de0a8d84d7a4ac17d"
        `)
    }

}
