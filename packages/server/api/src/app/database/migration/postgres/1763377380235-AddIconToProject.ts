import { MigrationInterface, QueryRunner } from 'typeorm'

enum ColorName {
    RED = 'RED',
    BLUE = 'BLUE',
    YELLOW = 'YELLOW',
    PURPLE = 'PURPLE',
    GREEN = 'GREEN',
    PINK = 'PINK',
    VIOLET = 'VIOLET',
    ORANGE = 'ORANGE',
    DARK_GREEN = 'DARK_GREEN',
    CYAN = 'CYAN',
    LAVENDER = 'LAVENDER',
    DEEP_ORANGE = 'DEEP_ORANGE',
}

const colors = Object.values(ColorName)

export class AddIconToProject1763377380235 implements MigrationInterface {
    name = 'AddIconToProject1763377380235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "icon" jsonb
        `)

        const projects = await queryRunner.query(`
            SELECT "id" FROM "project"
        `)

        for (const project of projects) {
            const randomIndex = Math.floor(Math.random() * 1000) % colors.length
            const randomColor = colors[randomIndex]
            await queryRunner.query(`
                UPDATE "project"
                SET "icon" = $1
                WHERE "id" = $2
            `, [JSON.stringify({ color: randomColor }), project.id])
        }

        await queryRunner.query(`
            ALTER TABLE "project"
            ALTER COLUMN "icon" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "icon"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_metadata"
            ADD "projectId" character varying(21)
        `)
    }

}
