import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class DropChatRolloutUserTable1870000000000 implements Migration {
    name = 'DropChatRolloutUserTable1870000000000'
    breaking = true
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "chat_rollout_user" CASCADE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_rollout_user" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "userId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "landedAt" TIMESTAMP WITH TIME ZONE,
                "chattedAt" TIMESTAMP WITH TIME ZONE,
                "grantedFreeCreditAt" TIMESTAMP WITH TIME ZONE,
                CONSTRAINT "PK_chat_rollout_user" PRIMARY KEY ("id")
            )
        `)
    }
}
