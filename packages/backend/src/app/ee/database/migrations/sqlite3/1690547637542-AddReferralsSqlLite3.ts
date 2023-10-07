import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddReferralsSqlLite31690547637542 implements MigrationInterface {
    name = 'AddReferralsSqlLite31690547637542'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "referal" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "referredUserId" varchar(21) NOT NULL, "referringUserId" varchar(21) NOT NULL)')
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId") ')
        await queryRunner.query('DROP INDEX "idx_flow_template_pieces"')
        await queryRunner.query('DROP INDEX "idx_flow_template_tags"')
        await queryRunner.query('CREATE TABLE "temporary_flow_template" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "description" varchar NOT NULL, "projectId" varchar, "template" text NOT NULL, "tags" varchar array NOT NULL, "pieces" varchar array NOT NULL, "pinnedOrder" integer, "blogUrl" varchar, CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)')
        await queryRunner.query('INSERT INTO "temporary_flow_template"("id", "created", "updated", "name", "description", "projectId", "template", "tags", "pieces", "pinnedOrder", "blogUrl") SELECT "id", "created", "updated", "name", "description", "projectId", "template", "tags", "pieces", "pinnedOrder", "blogUrl" FROM "flow_template"')
        await queryRunner.query('DROP TABLE "flow_template"')
        await queryRunner.query('ALTER TABLE "temporary_flow_template" RENAME TO "flow_template"')
        await queryRunner.query('CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces") ')
        await queryRunner.query('CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags") ')
        await queryRunner.query('DROP INDEX "idx_referral_referring_user_id"')
        await queryRunner.query('CREATE TABLE "temporary_referal" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "referredUserId" varchar(21) NOT NULL, "referringUserId" varchar(21) NOT NULL, CONSTRAINT "fk_referral_referred_user_id" FOREIGN KEY ("referredUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "fk_referral_referring_user_id" FOREIGN KEY ("referringUserId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)')
        await queryRunner.query('INSERT INTO "temporary_referal"("id", "created", "updated", "referredUserId", "referringUserId") SELECT "id", "created", "updated", "referredUserId", "referringUserId" FROM "referal"')
        await queryRunner.query('DROP TABLE "referal"')
        await queryRunner.query('ALTER TABLE "temporary_referal" RENAME TO "referal"')
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId") ')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_referral_referring_user_id"')
        await queryRunner.query('ALTER TABLE "referal" RENAME TO "temporary_referal"')
        await queryRunner.query('CREATE TABLE "referal" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "referredUserId" varchar(21) NOT NULL, "referringUserId" varchar(21) NOT NULL)')
        await queryRunner.query('INSERT INTO "referal"("id", "created", "updated", "referredUserId", "referringUserId") SELECT "id", "created", "updated", "referredUserId", "referringUserId" FROM "temporary_referal"')
        await queryRunner.query('DROP TABLE "temporary_referal"')
        await queryRunner.query('CREATE UNIQUE INDEX "idx_referral_referring_user_id" ON "referal" ("referredUserId", "referringUserId") ')
        await queryRunner.query('DROP INDEX "idx_flow_template_tags"')
        await queryRunner.query('DROP INDEX "idx_flow_template_pieces"')
        await queryRunner.query('ALTER TABLE "flow_template" RENAME TO "temporary_flow_template"')
        await queryRunner.query('CREATE TABLE "flow_template" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "description" varchar NOT NULL, "projectId" varchar, "template" text NOT NULL, "tags" varchar array NOT NULL, "pieces" varchar array NOT NULL, "pinnedOrder" integer, "blogUrl" varchar, CONSTRAINT "fk_flow_template_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)')
        await queryRunner.query('INSERT INTO "flow_template"("id", "created", "updated", "name", "description", "projectId", "template", "tags", "pieces", "pinnedOrder", "blogUrl") SELECT "id", "created", "updated", "name", "description", "projectId", "template", "tags", "pieces", "pinnedOrder", "blogUrl" FROM "temporary_flow_template"')
        await queryRunner.query('DROP TABLE "temporary_flow_template"')
        await queryRunner.query('CREATE INDEX "idx_flow_template_tags" ON "flow_template" ("tags") ')
        await queryRunner.query('CREATE INDEX "idx_flow_template_pieces" ON "flow_template" ("pieces") ')
        await queryRunner.query('DROP INDEX "idx_referral_referring_user_id"')
        await queryRunner.query('DROP TABLE "referal"')
    }

}
