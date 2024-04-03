import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class FileTypeCompression1694695212159 implements MigrationInterface {
    name = 'FileTypeCompression1694695212159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "temporary_file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21), "data" blob NOT NULL, "type" varchar NOT NULL DEFAULT (\'UNKNOWN\'), "compression" varchar NOT NULL DEFAULT (\'NONE\'), CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_file"("id", "created", "updated", "projectId", "data") SELECT "id", "created", "updated", "projectId", "data" FROM "file"',
        )
        await queryRunner.query('DROP TABLE "file"')
        await queryRunner.query('ALTER TABLE "temporary_file" RENAME TO "file"')

        logger.info('[FileTypeCompression1694695212159] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "file" RENAME TO "temporary_file"')
        await queryRunner.query(
            'CREATE TABLE "file" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "projectId" varchar(21), "data" blob NOT NULL, CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "file"("id", "created", "updated", "projectId", "data") SELECT "id", "created", "updated", "projectId", "data" FROM "temporary_file"',
        )
        await queryRunner.query('DROP TABLE "temporary_file"')

        logger.info('[FileTypeCompression1694695212159] down')
    }
}
