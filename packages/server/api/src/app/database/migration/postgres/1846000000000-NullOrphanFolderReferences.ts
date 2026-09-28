import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class NullOrphanFolderReferences1846000000000 implements Migration {
    name = 'NullOrphanFolderReferences1846000000000'
    breaking = true
    release = '0.91.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "flow"
            SET "folderId" = NULL
            WHERE "folderId" IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM "folder"
                WHERE "folder"."id" = "flow"."folderId"
                AND "folder"."projectId" = "flow"."projectId"
            )
        `)
        await queryRunner.query(`
            UPDATE "table"
            SET "folderId" = NULL
            WHERE "folderId" IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM "folder"
                WHERE "folder"."id" = "table"."folderId"
                AND "folder"."projectId" = "table"."projectId"
            )
        `)
    }

    public async down(): Promise<void> {
    }
}
