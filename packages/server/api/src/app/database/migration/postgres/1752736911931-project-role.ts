import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProjectRole1752736911931 implements MigrationInterface {
    name = 'ProjectRole1752736911931'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_role" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "permissions" character varying array NOT NULL,
                "platformId" character varying,
                "type" character varying NOT NULL,
                CONSTRAINT "PK_5974798305ac81d4a7d23ab1c6a" PRIMARY KEY ("id")
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "project_role"
        `)
    }
}
