import { Flow, FlowId, ProjectId } from "@activepieces/shared"

export enum DurableSystemJobName {
  DELETE_FLOW = 'delete-flow',
}

type DeleteFlowDurableSystemJobData =  {
  flowId: FlowId
  projectId: ProjectId
  flowToDelete?: Flow
  preDeleteDone?: boolean
  dbDeleteDone?: boolean
}

export type DurableSystemJobDataMap = {
  [DurableSystemJobName.DELETE_FLOW]: DeleteFlowDurableSystemJobData
}