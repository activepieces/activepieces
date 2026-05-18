import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveWorkerType1734439097357 implements MigrationInterface {
    name = 'RemoveWorkerType1734439097357'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_machine" DROP CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519"
        `)
        await queryRunner.query(`
            ALTER TABLE "worker_machine" DROP COLUMN "platformId"
        `)
        await queryRunner.query(`
            ALTER TABLE "worker_machine" DROP COLUMN "type"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
            ADD "type" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
            ADD "platformId" character varying(21)
        `)
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
            ADD CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

}
