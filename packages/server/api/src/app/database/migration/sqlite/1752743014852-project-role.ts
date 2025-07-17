import { MigrationInterface, QueryRunner } from 'typeorm'

export class ProjectRole1752743014852 implements MigrationInterface {
    name = 'ProjectRole1752743014852'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "project_role" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "name" varchar NOT NULL,
                "permissions" text NOT NULL,
                "platformId" varchar,
                "type" varchar NOT NULL
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "project_role"
        `)
    }
}
