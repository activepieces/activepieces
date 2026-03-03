import {
    flowStructureUtil,
    FlowVersion,
    isNil,
    Step,
} from '@activepieces/shared'
import { Migration } from '.'

export const migrateV16AddLastUpdatedDate: Migration = {
    targetSchemaVersion: '16',
    migrate: async (flowVersion: FlowVersion): Promise<FlowVersion> => {
        const newFlowVersion = flowStructureUtil.transferFlow(flowVersion, (step: Step) => {
            const lastTestDate = step.settings?.sampleData?.lastTestDate
            return {
                ...step,
                lastUpdatedDate: isNil(lastTestDate) ? flowVersion.updated : lastTestDate,
            }
        })
        return {
            ...newFlowVersion,
            schemaVersion: '17',
        }
    },
}
