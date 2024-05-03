import { MigrationInterface, QueryRunner } from 'typeorm'
import { isNotOneOfTheseEditions } from '../../../../database/database-common'
import { logger } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export class AddPlatform1697717995884 implements MigrationInterface {
    name = 'AddPlatform1697717995884'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            CREATE TABLE "platform" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "ownerId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "primaryColor" character varying NOT NULL,
                "logoIconUrl" character varying NOT NULL,
                "fullLogoUrl" character varying NOT NULL,
                "favIconUrl" character varying NOT NULL,
                CONSTRAINT "REL_94d6fd6494f0322c6f0e099141" UNIQUE ("ownerId"),
                CONSTRAINT "PK_c33d6abeebd214bd2850bfd6b8e" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "platform"
            ADD CONSTRAINT "fk_platform_user" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `)

        logger.info('AddPlatform1697717995884 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD, ApEdition.ENTERPRISE])) {
            return
        }
        await queryRunner.query(`
            ALTER TABLE "platform" DROP CONSTRAINT "fk_platform_user"
        `)
        await queryRunner.query(`
            DROP TABLE "platform"
        `)

        logger.info('AddPlatform1697717995884 down')
    }
}
