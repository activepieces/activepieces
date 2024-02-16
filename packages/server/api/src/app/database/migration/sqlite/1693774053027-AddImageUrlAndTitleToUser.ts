import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddImageUrlAndTitleToUser1693774053027
implements MigrationInterface {
    name = 'AddImageUrlAndTitleToUser1693774053027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "temporary_user" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "email" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "password" varchar NOT NULL, "status" varchar NOT NULL, "trackEvents" boolean, "newsLetter" boolean, "imageUrl" varchar, "title" varchar, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_user"("id", "created", "updated", "email", "firstName", "lastName", "password", "status", "trackEvents", "newsLetter") SELECT "id", "created", "updated", "email", "firstName", "lastName", "password", "status", "trackEvents", "newsLetter" FROM "user"',
        )
        await queryRunner.query('DROP TABLE "user"')
        await queryRunner.query('ALTER TABLE "temporary_user" RENAME TO "user"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "user" RENAME TO "temporary_user"')
        await queryRunner.query(
            'CREATE TABLE "user" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "email" varchar NOT NULL, "firstName" varchar NOT NULL, "lastName" varchar NOT NULL, "password" varchar NOT NULL, "status" varchar NOT NULL, "trackEvents" boolean, "newsLetter" boolean, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"))',
        )
        await queryRunner.query(
            'INSERT INTO "user"("id", "created", "updated", "email", "firstName", "lastName", "password", "status", "trackEvents", "newsLetter") SELECT "id", "created", "updated", "email", "firstName", "lastName", "password", "status", "trackEvents", "newsLetter" FROM "temporary_user"',
        )
        await queryRunner.query('DROP TABLE "temporary_user"')
    }
}
