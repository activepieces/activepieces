import { ApEdition } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'
import { isNotOneOfTheseEditions } from '../../database-common'

const log = system.globalLogger()

export class AddSigningKey1698602417745 implements MigrationInterface {
    name = 'AddSigningKey1698602417745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "signing_key" (
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
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD CONSTRAINT "fk_signing_key_generated_by" FOREIGN KEY ("generatedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        log.info('AddSigningKey1698602417745 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_generated_by"
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP CONSTRAINT "fk_signing_key_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "signing_key"
        `)

        log.info('AddSigningKey1698602417745 down')
    }
}
