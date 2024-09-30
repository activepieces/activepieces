import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkerMachine1720101280025 implements MigrationInterface {
    name = 'AddWorkerMachine1720101280025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21),
                "type" character varying NOT NULL,
                "information" jsonb NOT NULL,
                CONSTRAINT "PK_9d6b1b7507214e3480582ef32e7" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
            ADD CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_machine" DROP CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519"
        `)
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `)
    }

}
