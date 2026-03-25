import { MigrationInterface, QueryRunner } from 'typeorm'

export class TablesProduct1734355488179 implements MigrationInterface {
    name = 'TablesProduct1734355488179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "table" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "projectId" character varying(21) NOT NULL,
                CONSTRAINT "PK_28914b55c485fc2d7a101b1b2a4" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_table_project_id_name" ON "table" ("projectId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "field" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "tableId" character varying(21) NOT NULL,
                CONSTRAINT "PK_39379bba786d7a75226b358f81e" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
             CREATE INDEX "idx_field_table_id_name" ON "field" ("tableId", "name")
        `)
        await queryRunner.query(`
            CREATE TABLE "record" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "tableId" character varying(21) NOT NULL,
                CONSTRAINT "PK_5cb1f4d1aff275cf9001f4343b9" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "cell" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "recordId" character varying(21) NOT NULL,
                "fieldId" character varying(21) NOT NULL,
                "value" character varying NOT NULL,
                CONSTRAINT "PK_6f34717c251843e5ca32fc1b2b8" PRIMARY KEY ("id")
            )
        `)
        await queryRunner.query(`
            ALTER TABLE "table"
            ADD CONSTRAINT "fk_table_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD CONSTRAINT "fk_field_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "record"
            ADD CONSTRAINT "fk_record_table_id" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_record_id" FOREIGN KEY ("recordId") REFERENCES "record"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
        await queryRunner.query(`
            ALTER TABLE "cell"
            ADD CONSTRAINT "fk_cell_field_id" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_field_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "cell" DROP CONSTRAINT "fk_cell_record_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "record" DROP CONSTRAINT "fk_record_table_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "field" DROP CONSTRAINT "fk_field_table_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "table" DROP CONSTRAINT "fk_table_project_id"
        `)
        await queryRunner.query(`
            DROP TABLE "cell"
        `)
        await queryRunner.query(`
            DROP TABLE "record"
        `)
        await queryRunner.query(`
              DROP INDEX "idx_field_table_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "field"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_table_project_id_name"
        `)
        await queryRunner.query(`
            DROP TABLE "table"
        `)
    }

}
