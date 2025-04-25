import { flowStructureUtil, FlowVersion } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'


function extractConnectionIds(
    flowVersion: FlowVersion,
): string[] {
    const uniqueConnectionIds = new Set<string>()

    function extractIdFromConnectionString(authString: string): string[] {
        const match = authString.match(/{{connections\['([^']*(?:'\s*,\s*'[^']*)*)'\]}}/)
        if (!match) return []
        return match[1].split(/'\s*,\s*'/).map(id => id.trim())
    }

    function processAuth(auth: string) {
        const connectionIds = extractIdFromConnectionString(auth)
        for (const id of connectionIds) {
            uniqueConnectionIds.add(id)
        }
    }

    // Extract from trigger settings
    if (flowVersion.trigger.settings?.input?.auth) {
        processAuth(flowVersion.trigger.settings.input.auth)
    }

    // Extract from all steps
    const steps = flowStructureUtil.getAllSteps(flowVersion.trigger)
    for (const step of steps) {
        if (step.settings?.input?.auth) {
            processAuth(step.settings.input.auth)
        }
    }

    return Array.from(uniqueConnectionIds)
}

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
            const connectionIds = extractConnectionIds(flowVersion)

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
