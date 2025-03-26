import { MigrationInterface, QueryRunner } from 'typeorm'

export class InitialMsProjectConfig1742454177000 implements MigrationInterface {
    name = 'InitialMsProjectConfig1742454177000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ms_project_config" (
                "ms_project_config_id" int4 PRIMARY KEY NOT NULL,
                "ms_project_config_name" varchar(255) NULL,
                "ms_project_config_val" varchar(255) NULL
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "ms_project_config" (
                "ms_project_config_id" int4 PRIMARY KEY NOT NULL,
                "ms_project_config_name" varchar(255) NULL,
                "ms_project_config_val" varchar(255) NULL
            )
        `)
    }
}
