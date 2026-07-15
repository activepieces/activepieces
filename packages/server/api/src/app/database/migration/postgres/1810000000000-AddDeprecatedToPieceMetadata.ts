import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddDeprecatedToPieceMetadata1810000000000 implements Migration {
    name = 'AddDeprecatedToPieceMetadata1810000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" ADD "deprecated" boolean
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_metadata" DROP COLUMN "deprecated"
        `)
    }
}
