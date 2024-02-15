import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAppSumo1688943462327 implements MigrationInterface {
    name = 'AddAppSumo1688943462327'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "appsumo" ("uuid" character varying NOT NULL, "plan_id" character varying NOT NULL, "activation_email" character varying NOT NULL, CONSTRAINT "PK_3589df5be2973351814f727ae86" PRIMARY KEY ("uuid"))',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "appsumo"')
    }
}
