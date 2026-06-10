import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddUserIdentityIdIndex1774400000000 implements MigrationInterface {
    name = 'AddUserIdentityIdIndex1774400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE INDEX "idx_user_identity_id" ON "user" ("identityId")')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX "idx_user_identity_id"')
    }
}
