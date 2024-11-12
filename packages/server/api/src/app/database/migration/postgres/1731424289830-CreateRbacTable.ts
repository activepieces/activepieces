import { MigrationInterface, QueryRunner } from 'typeorm'

export class CreateRbacTable1731424289830 implements MigrationInterface {
    name = 'CreateRbacTable1731424289830'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "rbac" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "permissions" character varying array NOT NULL,
                "platformId" character varying NOT NULL,
                CONSTRAINT "PK_3c677495ab48997b2dc02048289" PRIMARY KEY ("id")
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "rbac"
        `)
    }

}
