import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddProfilePicture1760504093297 implements MigrationInterface {
    name = 'AddProfilePicture1760504093297'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity"
            ADD "profileImageUrl" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_identity" DROP COLUMN "profileImageUrl"
        `)
    }

}
