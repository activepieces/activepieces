import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddImageToUser1768502658760 implements MigrationInterface {
    name = 'AddImageToUser1768502658760'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ADD "imageUrl" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity" DROP COLUMN "imageUrl"
        `)
    }

}
