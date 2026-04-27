import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUserSandboxTable1784000000000 implements Migration {
    name = 'AddUserSandboxTable1784000000000'
    breaking = false
    release = '0.83.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_sandbox" (
                "id" character varying(21) NOT NULL,
                "created" timestamp with time zone NOT NULL DEFAULT now(),
                "updated" timestamp with time zone NOT NULL DEFAULT now(),
                "userId" character varying(21) NOT NULL,
                "platformId" character varying(21) NOT NULL,
                "sandboxId" character varying NOT NULL,
                "lastUsedAt" timestamp with time zone NOT NULL DEFAULT now(),
                CONSTRAINT "pk_user_sandbox" PRIMARY KEY ("id"),
                CONSTRAINT "fk_user_sandbox_user_id" FOREIGN KEY ("userId")
                    REFERENCES "user" ("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_sandbox_user_id"
            ON "user_sandbox" ("userId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE IF EXISTS "user_sandbox"')
    }
}
