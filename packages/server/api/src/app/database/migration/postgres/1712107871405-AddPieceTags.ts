import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceTags1712107871405 implements MigrationInterface {
    name = 'AddPieceTags1712107871405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "tag" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "name" character varying NOT NULL,
                CONSTRAINT "UQ_0aaf8e30187e0b89ebc9c4764ba" UNIQUE ("platformId", "name"),
                CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "piece_tag" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying NOT NULL,
                "pieceName" character varying NOT NULL,
                "tagId" character varying NOT NULL,
                CONSTRAINT "UQ_84a810ed305b758e07fa57f604a" UNIQUE ("tagId", "pieceName"),
                CONSTRAINT "PK_f06201adf8d82249e8f2f390426" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "tag_platformId" ON "piece_tag" ("platformId")
        `)
        await queryRunner.query(`
            ALTER TABLE "tag"
            ADD CONSTRAINT "FK_9dec09e187398715b7f1e32a6cb" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_tag"
            ADD CONSTRAINT "FK_6ee5c7cca2b33700e400ea2703e" FOREIGN KEY ("tagId") REFERENCES "tag"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_tag"
            ADD CONSTRAINT "FK_5f483919deb37416ff32594918a" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "piece_tag" DROP CONSTRAINT "FK_5f483919deb37416ff32594918a"
        `)
        await queryRunner.query(`
            ALTER TABLE "piece_tag" DROP CONSTRAINT "FK_6ee5c7cca2b33700e400ea2703e"
        `)
        await queryRunner.query(`
            ALTER TABLE "tag" DROP CONSTRAINT "FK_9dec09e187398715b7f1e32a6cb"
        `)
        await queryRunner.query(`
            DROP INDEX "public"."tag_platformId"
        `)
        await queryRunner.query(`
            DROP TABLE "piece_tag"
        `)
        await queryRunner.query(`
            DROP TABLE "tag"
        `)
    }

}
