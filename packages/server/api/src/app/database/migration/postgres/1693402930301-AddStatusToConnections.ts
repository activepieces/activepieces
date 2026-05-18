import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddStatusToConnections1693402930301 implements MigrationInterface {
    name = 'AddStatusToConnections1693402930301'

    public async up(queryRunner: QueryRunner): Promise<void> {
    // Add the new column without NOT NULL constraint first
        await queryRunner.query(
            'ALTER TABLE "app_connection" ADD "status" character varying DEFAULT \'ACTIVE\'',
        )

        // Update existing rows to set the default value
        await queryRunner.query(
            'UPDATE "app_connection" SET "status" = \'ACTIVE\'',
        )

        // Finally, alter the column to set NOT NULL constraint
        await queryRunner.query(
            'ALTER TABLE "app_connection" ALTER COLUMN "status" SET NOT NULL',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove NOT NULL constraint first
        await queryRunner.query(
            'ALTER TABLE "app_connection" ALTER COLUMN "status" DROP NOT NULL',
        )

        // Drop the "status" column
        await queryRunner.query(
            'ALTER TABLE "app_connection" DROP COLUMN "status"',
        )
    }
}
