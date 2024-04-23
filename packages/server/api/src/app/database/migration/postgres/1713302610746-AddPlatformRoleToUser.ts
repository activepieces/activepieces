import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPlatformRoleToUser1713302610746 implements MigrationInterface {
    name = 'AddPlatformRoleToUser1713302610746'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "imageUrl"
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "title"
        `)
        await queryRunner.query(`
        ALTER TABLE "user"
        ADD "platformRole" character varying;
        `)

        await queryRunner.query(`
        UPDATE "user"
        SET "platformRole" = 'MEMBER';
        `)

        await queryRunner.query(`
        UPDATE "user"
        SET "platformRole" = 'ADMIN'
        WHERE "id" IN (
            SELECT "ownerId"
            FROM "platform"
        )
    `)
        await queryRunner.query(`
        ALTER TABLE "user"
        ALTER COLUMN "platformRole" SET NOT NULL;
     `)

        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "platformId" DROP NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("platformId", "email")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("platformId", "externalId")
        `)

        const adminUserIds = await queryRunner.query(`
            SELECT id
            FROM "user"
            WHERE "platformRole" = 'ADMIN'
        `)
        const ownerIds = await queryRunner.query(`
            SELECT "ownerId"
            FROM "platform"
        `)
        const adminUserIdsSet = new Set(adminUserIds.map((u: { id: string }) => u.id))
        const ownerIdsSet = new Set(ownerIds.map((p: { ownerId: string }) => p.ownerId))

        if (adminUserIdsSet.size !== ownerIdsSet.size || !Array.from(adminUserIdsSet).every(id => ownerIdsSet.has(id))) {
            throw new Error('Admin user IDs and owner IDs do not match')
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_external_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_user_platform_id_email"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ALTER COLUMN "platformId"
            SET NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_email" ON "user" ("email", "platformId")
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_user_platform_id_external_id" ON "user" ("externalId", "platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "platformRole"
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "title" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "imageUrl" character varying
        `)
    }

}
