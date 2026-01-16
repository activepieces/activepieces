import { MigrationInterface, QueryRunner } from 'typeorm'

export class ADDIMAGETOUSER1768502658760 implements MigrationInterface {
    name = 'ADDIMAGETOUSER1768502658760'

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
