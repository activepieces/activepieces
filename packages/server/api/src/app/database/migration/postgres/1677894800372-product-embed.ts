import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

export class productEmbed1677894800372 implements MigrationInterface {
    name = 'productEmbed1677894800372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const log = system.globalLogger()
        const appCredentialExistsQuery: { exists: boolean }[] =
      await queryRunner.query(
          `SELECT exists (
            SELECT FROM information_schema.tables
              WHERE  table_schema = 'public'
              AND    table_name   = 'app_credential'
          )`,
      )

        const appCredentialExists =
      appCredentialExistsQuery &&
      appCredentialExistsQuery.length > 0 &&
      appCredentialExistsQuery[0].exists

        if (appCredentialExists) {
            log.info('initializeSchema1676238396411: skipped')
            return
        }
        await queryRunner.query(
            'CREATE TABLE "app_credential" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "appName" character varying NOT NULL, "projectId" character varying(21) NOT NULL, "settings" jsonb NOT NULL, CONSTRAINT "PK_62eb102bb75a05d2951796a3b46" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_credentials_projectId_appName" ON "app_credential" ("appName", "projectId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "connection_key" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "settings" jsonb NOT NULL, CONSTRAINT "PK_4dcf1d9ae4ba5eb261a6c775ad2" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_connection_key_project_id" ON "connection_key" ("projectId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "app_credential" ADD CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "connection_key" ADD CONSTRAINT "FK_03177dc6779e6e147866d43c050" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_connection_key_project_id"',
        )
        await queryRunner.query('DROP TABLE "connection_key"')
        await queryRunner.query(
            'DROP INDEX "idx_app_credentials_projectId_appName"',
        )
        await queryRunner.query('DROP TABLE "app_credential"')
        await queryRunner.query(
            'ALTER TABLE "connection_key" DROP CONSTRAINT "FK_03177dc6779e6e147866d43c050"',
        )
        await queryRunner.query(
            'ALTER TABLE "app_credential" DROP CONSTRAINT "FK_d82bfb4c7432a69dc2419083a0e"',
        )
    }
}
