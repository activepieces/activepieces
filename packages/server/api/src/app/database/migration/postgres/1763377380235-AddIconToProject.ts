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
            ALTER TABLE "project"
            ADD "icon" jsonb
        `)

        const projects = await queryRunner.query(`
            SELECT "id" FROM "project"
        `)

        if (projects.length > 0) {
            const valuesClause = projects.map((project: { id: string }) => {
                const randomIndex = Math.floor(Math.random() * 1000) % colors.length
                const randomColor = colors[randomIndex]
                const iconJson = JSON.stringify({ color: randomColor })
                return `('${project.id}', '${iconJson}')`
            }).join(', ')

            await queryRunner.query(`
                UPDATE "project"
                SET "icon" = v.icon::jsonb
                FROM (VALUES ${valuesClause}) AS v(id, icon)
                WHERE "project"."id" = v.id
            `)
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
    }

}
