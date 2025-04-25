import { flowStructureUtil } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddConnectionIdsToFlowVersion1745530653784 implements MigrationInterface {
    name = 'AddConnectionIdsToFlowVersion1745530653784'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First add the column as nullable
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ADD "connectionIds" character varying array
        `)

        // Update existing rows
        const flowVersions = await queryRunner.query('SELECT * FROM flow_version')
        for (const flowVersion of flowVersions) {
            const connectionIds = flowStructureUtil.extractConnectionIds(flowVersion)

            await queryRunner.query('UPDATE flow_version SET "connectionIds" = $1 WHERE id = $2', [connectionIds, flowVersion.id])
        }

        // Now make the column NOT NULL
        await queryRunner.query(`
            ALTER TABLE "flow_version"
            ALTER COLUMN "connectionIds" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_version" DROP COLUMN "connectionIds"
        `)
    }

}
