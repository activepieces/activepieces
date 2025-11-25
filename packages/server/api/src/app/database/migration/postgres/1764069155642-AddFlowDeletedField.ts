import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlowDeletedField1764069155642 implements MigrationInterface {
    name = 'AddFlowDeletedField1764069155642'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
                ADD COLUMN "deleted" boolean NOT NULL DEFAULT false
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> { 
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "deleted"
        `)
    }   

}
