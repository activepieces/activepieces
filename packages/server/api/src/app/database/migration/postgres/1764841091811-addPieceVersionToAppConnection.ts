import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceVersionToAppConnection1764841091811 implements MigrationInterface {
    name = 'AddPieceVersionToAppConnection1764841091811'

    public async up(queryRunner: QueryRunner): Promise<void> {
             // Add pieceVersion column as nullable first
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "pieceVersion" character varying
        `)
        
        // Populate pieceVersion with the latest version from piece_metadata
        // matching on pieceName and platformId
        await queryRunner.query(`
            UPDATE "app_connection" ac
            SET "pieceVersion" = (
                SELECT pm."version"
                FROM "piece_metadata" pm
                WHERE pm."name" = ac."pieceName"
                ORDER BY pm."version" DESC
                LIMIT 1
            )
            WHERE ac."pieceName" IS NOT NULL
        `)
        
        // For connections without a matching piece_metadata, use a default value
        // (you may want to adjust this based on your business logic)
        await queryRunner.query(`
            UPDATE "app_connection"
            SET "pieceVersion" = '0.0.0'
            WHERE "pieceVersion" IS NULL
        `)
        
        // Now make the column NOT NULL
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ALTER COLUMN "pieceVersion" SET NOT NULL
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "pieceVersion"
        `)
    }

}
