import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddAutoCreatePersonalProjectsToPlatform1834000000000 implements Migration {
    name = 'AddAutoCreatePersonalProjectsToPlatform1834000000000'
    breaking = false
    release = '0.87.1'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD "autoCreatePersonalProjects" boolean NOT NULL DEFAULT true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "platform" DROP COLUMN "autoCreatePersonalProjects"
        `)
    }
}
