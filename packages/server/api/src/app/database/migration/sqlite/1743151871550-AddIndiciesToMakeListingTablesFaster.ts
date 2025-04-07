import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddIndiciesToMakeListingTablesFaster1743151871550 implements MigrationInterface {
    name = 'AddIndiciesToMakeListingTablesFaster1743151871550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE INDEX "idx_record_created" ON "record" ("created")
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_cell_value" ON "cell" ("value")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_cell_value"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_record_created"
        `)
    }

}
