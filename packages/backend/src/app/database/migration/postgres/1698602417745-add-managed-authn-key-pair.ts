import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '../../../helper/logger'

export class AddManagedAuthnKeyPair1698602417745 implements MigrationInterface {
    name = 'AddManagedAuthnKeyPair1698602417745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "managed_authn_key_pair" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "publicKey" character varying NOT NULL,
                "algorithm" character varying NOT NULL,
                "generatedBy" character varying(21) NOT NULL,
                CONSTRAINT "PK_934695464c4ffe5280d79ff541a" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "managed_authn_key_pair"
            ADD CONSTRAINT "fk_managed_authn_key_pair_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
        await queryRunner.query(`
            ALTER TABLE "managed_authn_key_pair"
            ADD CONSTRAINT "fk_managed_authn_key_pair_generated_by" FOREIGN KEY ("generatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info('AddManagedAuthnKeyPair1698602417745 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "managed_authn_key_pair" DROP CONSTRAINT "fk_managed_authn_key_pair_generated_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "managed_authn_key_pair" DROP CONSTRAINT "fk_managed_authn_key_pair_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "managed_authn_key_pair"
        `)

        logger.info('AddManagedAuthnKeyPair1698602417745 down')
    }

}
