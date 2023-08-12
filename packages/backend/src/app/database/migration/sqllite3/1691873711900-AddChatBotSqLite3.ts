import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatBotSqLite31691873711900 implements MigrationInterface {
    name = 'AddChatBotSqLite31691873711900'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "dataSources" text NOT NULL, "settings" text NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "dataSources" text NOT NULL, "settings" text NOT NULL, CONSTRAINT "FK_d2f5f245c27541cd70f13f169eb" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_chatbot"("id", "created", "updated", "type", "displayName", "projectId", "dataSources", "settings") SELECT "id", "created", "updated", "type", "displayName", "projectId", "dataSources", "settings" FROM "chatbot"`);
        await queryRunner.query(`DROP TABLE "chatbot"`);
        await queryRunner.query(`ALTER TABLE "temporary_chatbot" RENAME TO "chatbot"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chatbot" RENAME TO "temporary_chatbot"`);
        await queryRunner.query(`CREATE TABLE "chatbot" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime('now')), "updated" datetime NOT NULL DEFAULT (datetime('now')), "type" varchar NOT NULL, "displayName" varchar NOT NULL, "projectId" varchar NOT NULL, "dataSources" text NOT NULL, "settings" text NOT NULL)`);
        await queryRunner.query(`INSERT INTO "chatbot"("id", "created", "updated", "type", "displayName", "projectId", "dataSources", "settings") SELECT "id", "created", "updated", "type", "displayName", "projectId", "dataSources", "settings" FROM "temporary_chatbot"`);
        await queryRunner.query(`DROP TABLE "temporary_chatbot"`);
        await queryRunner.query(`DROP TABLE "chatbot"`);
    }

}
