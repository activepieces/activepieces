import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddChatBotSqlite1696029443045 implements MigrationInterface {
    name = 'AddChatBotSqlite1696029443045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (await migrationRan('AddChatBotSqlite31696029443045', queryRunner)) {
            return
        }
        await queryRunner.query(
            'CREATE TABLE "chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "connectionId" varchar, "visibilityStatus" varchar NOT NULL, "dataSources" text NOT NULL, "prompt" varchar)',
        )
        await queryRunner.query(
            'CREATE TABLE "temporary_chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "connectionId" varchar, "visibilityStatus" varchar NOT NULL, "dataSources" text NOT NULL, "prompt" varchar, CONSTRAINT "FK_d2f5f245c27541cd70f13f169eb" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_13f7ad52cefa43433864732c384" FOREIGN KEY ("connectionId") REFERENCES "app_connection" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_chatbot"("id", "created", "updated", "type", "displayName", "projectId", "connectionId", "visibilityStatus", "dataSources", "prompt") SELECT "id", "created", "updated", "type", "displayName", "projectId", "connectionId", "visibilityStatus", "dataSources", "prompt" FROM "chatbot"',
        )
        await queryRunner.query('DROP TABLE "chatbot"')
        await queryRunner.query(
            'ALTER TABLE "temporary_chatbot" RENAME TO "chatbot"',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "chatbot" RENAME TO "temporary_chatbot"',
        )
        await queryRunner.query(
            'CREATE TABLE "chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "connectionId" varchar, "visibilityStatus" varchar NOT NULL, "dataSources" text NOT NULL, "prompt" varchar)',
        )
        await queryRunner.query(
            'INSERT INTO "chatbot"("id", "created", "updated", "type", "displayName", "projectId", "connectionId", "visibilityStatus", "dataSources", "prompt") SELECT "id", "created", "updated", "type", "displayName", "projectId", "connectionId", "visibilityStatus", "dataSources", "prompt" FROM "temporary_chatbot"',
        )
        await queryRunner.query('DROP TABLE "temporary_chatbot"')
        await queryRunner.query('DROP TABLE "chatbot"')
    }
}

async function migrationRan(
    migration: string,
    queryRunner: QueryRunner,
): Promise<boolean> {
    const result = await queryRunner.query(
        'SELECT * from migrations where name = ?',
        [migration],
    )
    return result.length > 0
}
