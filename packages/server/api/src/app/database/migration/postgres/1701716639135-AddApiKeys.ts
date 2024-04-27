import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../database-common'
import { ApEdition } from '@activepieces/shared'

export class AddApiKeys1701716639135 implements MigrationInterface {
    name = 'AddApiKeys1701716639135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "api_key" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "displayName" character varying NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "hashedValue" character varying NOT NULL,
                "truncatedValue" character varying NOT NULL,
                CONSTRAINT "PK_b1bd840641b8acbaad89c3d8d11" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "api_key"
            ADD CONSTRAINT "fk_api_key_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "api_key" DROP CONSTRAINT "fk_api_key_platform_id"
        `)
        await queryRunner.query(`
            DROP TABLE "api_key"
        `)
    }
}
