import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDefaultToAiProvidersEnabled1776000000000 implements Migration {
    name = 'AddDefaultToAiProvidersEnabled1776000000000'
    breaking = false
    release = '0.82.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ALTER COLUMN "aiProvidersEnabled" SET DEFAULT false')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "platform_plan" ALTER COLUMN "aiProvidersEnabled" DROP DEFAULT')
    }
}
