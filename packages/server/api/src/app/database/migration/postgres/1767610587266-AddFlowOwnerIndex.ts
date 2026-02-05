import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowOwnerIndex1767610587266 implements MigrationInterface {
    name = 'AddFlowOwnerIndex1767610587266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            TRUNCATE TABLE "user_badge"
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_flow_owner_id" ON "flow" ("ownerId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_flow_owner_id"
        `)
    }

}
