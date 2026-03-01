import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddAuthorsToPieces1710098373707 implements MigrationInterface {
    name = 'AddAuthorsToPieces1710098373707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add the column "authors" with a varying array type
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "authors" character varying array;
        `)

        // Step 2: Set the existing data in "authors" to an empty array
        await queryRunner.query(`
            UPDATE "piece_metadata"
            SET "authors" = ARRAY[]::varchar[];
        `)

        // Step 3: Add the NOT NULL constraint to the "authors" column
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ALTER COLUMN "authors" SET NOT NULL;
        `)


    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "authors"
        `)
    }

}
