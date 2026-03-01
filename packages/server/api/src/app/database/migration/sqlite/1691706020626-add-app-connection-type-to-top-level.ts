import { MigrationInterface, QueryRunner } from 'typeorm'
import { encryptUtils } from '../../../helper/encryption'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

type AppConnectionValue = {
    type: string
}

export class AddAppConnectionTypeToTopLevel1691706020626
implements MigrationInterface {
    name = 'AddAppConnectionTypeToTopLevel1691706020626'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('AddAppConnectionTypeToTopLevel1691706020626 up')

        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, "type" varchar, CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_app_connection"("id", "created", "updated", "name", "appName", "projectId", "value") SELECT "id", "created", "updated", "name", "appName", "projectId", "value" FROM "app_connection"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query(
            'ALTER TABLE "temporary_app_connection" RENAME TO "app_connection"',
        )

        const connections = await queryRunner.query('SELECT * FROM app_connection')

        for (const currentConnection of connections) {
            try {
                const connectionValue = await encryptUtils.decryptObject<AppConnectionValue>(
                    JSON.parse(currentConnection.value),
                )
                await queryRunner.query(
                    `UPDATE "app_connection" SET "type" = '${connectionValue.type}' WHERE id = '${currentConnection.id}'`,
                )
            }
            catch (e) {
                log.error(e)
            }
        }

        await queryRunner.query(
            'CREATE TABLE "temporary_app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, "type" varchar NOT NULL, CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_app_connection"("id", "created", "updated", "name", "appName", "projectId", "value", "type") SELECT "id", "created", "updated", "name", "appName", "projectId", "value", "type" FROM "app_connection"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query(
            'ALTER TABLE "temporary_app_connection" RENAME TO "app_connection"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )

        log.info('AddAppConnectionTypeToTopLevel1691706020626 finished')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        log.info('AddAppConnectionTypeToTopLevel1691706020626 down')

        await queryRunner.query(
            'DROP INDEX "idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'ALTER TABLE "app_connection" RENAME TO "temporary_app_connection"',
        )
        await queryRunner.query(
            'CREATE TABLE "app_connection" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "appName" varchar NOT NULL, "projectId" varchar(21) NOT NULL, "value" text NOT NULL, CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "app_connection"("id", "created", "updated", "name", "appName", "projectId", "value") SELECT "id", "created", "updated", "name", "appName", "projectId", "value" FROM "temporary_app_connection"',
        )
        await queryRunner.query('DROP TABLE "temporary_app_connection"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )

        log.info('AddAppConnectionTypeToTopLevel1691706020626 finished')
    }
}
