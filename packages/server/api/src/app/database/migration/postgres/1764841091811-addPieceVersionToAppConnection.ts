import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceVersionToAppConnection1764841091811 implements MigrationInterface {
    name = 'AddPieceVersionToAppConnection1764841091811'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "pieceVersion" character varying
        `)
        

        await queryRunner.query(`
            UPDATE "app_connection" ac
            SET "pieceVersion" = (
                SELECT pm."version"
                FROM "piece_metadata" pm
                WHERE pm."name" = ac."pieceName"
                  AND pm."version" ~ '^[0-9]+\\.[0-9]+\\.[0-9]+$'
                ORDER BY 
                    (string_to_array(pm."version", '.'))[1]::int DESC,
                    (string_to_array(pm."version", '.'))[2]::int DESC,
                    (string_to_array(pm."version", '.'))[3]::int DESC
                LIMIT 1
            )
            WHERE ac."pieceName" IS NOT NULL
        `)
        

        await queryRunner.query(`
            UPDATE "app_connection"
            SET "pieceVersion" = '0.0.0'
            WHERE "pieceVersion" IS NULL
        `)
        
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
