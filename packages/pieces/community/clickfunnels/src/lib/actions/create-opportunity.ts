import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';

export const createOpportunity = createAction({
    name: 'create_opportunity',
    displayName: 'Create Opportunity',
    description: 'Create a new opportunity for a contact in the sales pipeline',
    auth: clickfunnelsAuth,
    props: {
        workspace_id: Property.ShortText({
            displayName: 'Workspace ID',
            description: 'The ID of the workspace',
            required: true,
        }),
        primary_contact_id: Property.ShortText({
            displayName: 'Primary Contact ID',
            description: 'The ID of the primary contact for this opportunity',
            required: true,
        }),
        pipeline_id: Property.Dropdown({
            displayName: 'Pipeline',
            description: 'Select the sales pipeline (optional)',
            required: false,
            refreshers: ['workspace_id'],
            options: async ({ auth, workspace_id }) => {
                if (!auth || !workspace_id) return {
                    disabled: true,
                    options: [],
                    placeholder: workspace_id ? 'Please authenticate first' : 'Please enter workspace ID first'
                };

                try {
                    const subdomain = clickfunnelsCommon.extractSubdomain(auth as any);
                    const response = await clickfunnelsCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri: `/workspaces/${workspace_id}/sales/pipelines`,
                        subdomain,
                    });

                    return {
                        disabled: false,
                        options: response.body.map((pipeline: any) => ({
                            label: pipeline.name,
                            value: pipeline.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading pipelines'
                    };
                }
            }
        }),
        pipelines_stage_id: Property.Dropdown({
            displayName: 'Pipeline Stage',
            description: 'Select the pipeline stage',
            required: true,
            refreshers: ['workspace_id', 'pipeline_id'],
            options: async ({ auth, workspace_id, pipeline_id }) => {
                if (!auth || !workspace_id) return {
                    disabled: true,
                    options: [],
                    placeholder: workspace_id ? 'Please authenticate first' : 'Please enter workspace ID first'
                };

                try {
                    const subdomain = clickfunnelsCommon.extractSubdomain(auth as any);
                    let resourceUri = `/workspaces/${workspace_id}/sales/pipelines/stages`;
                    
                    if (pipeline_id) {
                        resourceUri = `/workspaces/${workspace_id}/sales/pipelines/${pipeline_id}/stages`;
                    }
                    
                    const response = await clickfunnelsCommon.apiCall({
                        auth: auth as any,
                        method: HttpMethod.GET,
                        resourceUri,
                        subdomain,
                    });

                    return {
                        disabled: false,
                        options: response.body.map((stage: any) => ({
                            label: stage.name,
                            value: stage.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading stages'
                    };
                }
            }
        }),
        name: Property.ShortText({
            displayName: 'Opportunity Name',
            description: 'Name of the opportunity',
            required: true,
        }),
        value: Property.Number({
            displayName: 'Value',
            description: 'The potential value of this opportunity in the default currency of the workspace',
            required: false,
        }),
        closed_at: Property.DateTime({
            displayName: 'Close Date',
            description: 'Expected or actual close date for the opportunity',
            required: false,
        }),
        assignee_id: Property.ShortText({
            displayName: 'Assignee ID',
            description: 'The ID of the Team-Membership to whom the opportunity is assigned',
            required: false,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Additional notes about the opportunity',
            required: false,
        }),
    },
    async run(context) {
        const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
        const workspaceId = context.propsValue.workspace_id;
        
        const salesOpportunity: Record<string, any> = {
            name: context.propsValue.name,
            primary_contact_id: parseInt(context.propsValue.primary_contact_id),
            pipelines_stage_id: parseInt(context.propsValue.pipelines_stage_id),
        };

        if (context.propsValue.pipeline_id) {
            salesOpportunity['pipeline_id'] = context.propsValue.pipeline_id;
        }

        if (context.propsValue.value) {
            salesOpportunity['value'] = context.propsValue.value;
        }

        if (context.propsValue.closed_at) {
            salesOpportunity['closed_at'] = new Date(context.propsValue.closed_at).toISOString();
        }

        if (context.propsValue.assignee_id) {
            salesOpportunity['assignee_id'] = context.propsValue.assignee_id;
        }

        if (context.propsValue.notes) {
            salesOpportunity['notes'] = [{
                content: context.propsValue.notes
            }];
        }

        const response = await clickfunnelsCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/workspaces/${workspaceId}/sales/opportunities`,
            body: { sales_opportunity: salesOpportunity },
            subdomain,
        });

        return response.body;
    },
});
