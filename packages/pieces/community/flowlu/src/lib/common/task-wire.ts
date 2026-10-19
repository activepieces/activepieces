import { FormValue } from './client';
import { flowluInput } from './utils';

export const flowluTaskWire = {
  fields: (props: {
    name?: string;
    description?: string;
    priority?: number;
    plan_start_date?: string;
    deadline?: string;
    deadline_allowchange?: boolean;
    task_checkbyowner?: boolean;
    responsible_id?: number;
    owner_id?: number;
    workflow_id?: number;
    workflow_stage_id?: number;
    project_id?: number;
    crm_account_id?: number;
  }): Record<string, FormValue> => {
    const projectId = flowluInput.optionalId({
      value: props.project_id,
      name: 'Project',
    });
    return {
      name: props.name,
      description: props.description,
      priority: props.priority,
      plan_start_date: flowluInput.formatDateTime({
        value: props.plan_start_date,
        name: 'Start Date',
      }),
      deadline: flowluInput.formatDateTime({
        value: props.deadline,
        name: 'End Date',
      }),
      deadline_allowchange: props.deadline_allowchange ? 1 : 0,
      task_checkbyowner: props.task_checkbyowner ? 1 : 0,
      responsible_id: props.responsible_id,
      owner_id: props.owner_id,
      workflow_id: props.workflow_id,
      workflow_stage_id: props.workflow_stage_id,
      module: projectId === undefined ? undefined : 'st',
      model: projectId === undefined ? undefined : 'project',
      model_id: projectId,
      crm_account_id: flowluInput.optionalId({
        value: props.crm_account_id,
        name: 'CRM Account',
      }),
    };
  },
};
