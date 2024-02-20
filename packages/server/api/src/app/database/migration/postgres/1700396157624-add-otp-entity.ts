import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from 'server-shared'

export class AddOtpEntity1700396157624 implements MigrationInterface {
    name = 'AddOtpEntity1700396157624'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "otp" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "type" character varying NOT NULL,
                "userId" character varying(21) NOT NULL,
                "value" character varying NOT NULL,
                CONSTRAINT "PK_32556d9d7b22031d7d0e1fd6723" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_otp_user_id_type" ON "otp" ("userId", "type")
        `)
        await queryRunner.query(`
            ALTER TABLE "otp"
            ADD CONSTRAINT "fk_otp_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)

        logger.info('AddOtpEntity1700396157624 up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "otp" DROP CONSTRAINT "fk_otp_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."idx_otp_user_id_type"
        `)
        await queryRunner.query(`
            DROP TABLE "otp"
        `)

        logger.info('AddOtpEntity1700396157624 down')
    }
}
