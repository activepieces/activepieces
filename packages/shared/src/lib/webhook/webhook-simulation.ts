import { BaseModel } from '../common/base-model'
import { ApId } from '../common/id-generator'
import { FlowId } from '../flows/flow'
import { ProjectId } from '../project/project'

export type WebhookSimulationId = ApId

export type WebhookSimulation = BaseModel<WebhookSimulationId> & {
    flowId: FlowId
    projectId: ProjectId
}
