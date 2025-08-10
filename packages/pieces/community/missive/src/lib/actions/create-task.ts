import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const createTask = createAction({
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a task that can be standalone or associated with a conversation',
    auth: missiveAuth,
    props: {
        task_type: Property.StaticDropdown({
            displayName: 'Task Type',
            description: 'Type of task to create',
            required: true,
            options: {
                options: [
                    { label: 'Standalone Task', value: 'standalone' },
                    { label: 'Conversation Subtask', value: 'subtask' }
                ]
            }
        }),
        title: Property.ShortText({
            displayName: 'Task Title',
            description: 'Title of the task (max 1000 characters)',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the task (max 10000 characters)',
            required: false,
        }),
        state: Property.StaticDropdown({
            displayName: 'Task State',
            description: 'Current state of the task',
            required: false,
            defaultValue: 'todo',
            options: {
                options: [
                    { label: 'Todo', value: 'todo' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Closed', value: 'closed' }
                ]
            }
        }),
        due_at: Property.DateTime({
            displayName: 'Due Date',
            description: 'Due date for the task',
            required: false,
        }),
        task_configuration: Property.DynamicProperties({
            displayName: 'Task Configuration',
            description: 'Configure task assignment and organization based on task type',
            required: false,
            refreshers: ['task_type'],
            props: async ({ auth, task_type }) => {
                if (!auth || !task_type) {
                    return {
                        placeholder: Property.ShortText({
                            displayName: 'Select Task Type',
                            description: 'Please select a task type first',
                            required: false,
                        })
                    };
                }

                let organizationOptions: Array<{ label: string; value: string }> = [];
                let teamOptions: Array<{ label: string; value: string }> = [];
                let userOptions: Array<{ label: string; value: string }> = [];
                let conversationOptions: Array<{ label: string; value: string }> = [];

                try {
                    const orgsResponse = await missiveCommon.apiCall({
                        auth: auth as unknown as string,
                        method: HttpMethod.GET,
                        resourceUri: '/organizations',
                    });
                    organizationOptions = orgsResponse.body?.organizations?.map((org: any) => ({ 
                        label: org.name, 
                        value: org.id 
                    })) || [];

                    if (organizationOptions.length > 0) {
                        try {
                            const teamsResponse = await missiveCommon.apiCall({
                                auth: auth as unknown as string,
                                method: HttpMethod.GET,
                                resourceUri: `/teams?organization=${organizationOptions[0].value}`,
                            });
                            teamOptions = teamsResponse.body?.teams?.map((team: any) => ({ 
                                label: team.name, 
                                value: team.id 
                            })) || [];
                        } catch (error) {
                            console.error('Failed to fetch teams:', error);
                        }

                        try {
                            const usersResponse = await missiveCommon.apiCall({
                                auth: auth as unknown as string,
                                method: HttpMethod.GET,
                                resourceUri: `/users?organization=${organizationOptions[0].value}`,
                            });
                            userOptions = usersResponse.body?.users?.map((user: any) => ({ 
                                label: `${user.name} (${user.email})`, 
                                value: user.id 
                            })) || [];
                        } catch (error) {
                            console.error('Failed to fetch users:', error);
                        }
                    }

                    if (task_type as unknown as string === 'subtask') {
                        try {
                            const convsResponse = await missiveCommon.apiCall({
                                auth: auth as unknown as string,
                                method: HttpMethod.GET,
                                resourceUri: '/conversations?limit=50',
                            });
                            conversationOptions = convsResponse.body?.conversations?.map((conv: any) => {
                                const subject = conv.subject || conv.latest_message_subject || 'No Subject';
                                const label = subject.length > 50 ? `${subject.substring(0, 50)}...` : subject;
                                return { label, value: conv.id };
                            }) || [];
                        } catch (error) {
                            console.error('Failed to fetch conversations:', error);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch task options:', error);
                }

                const props: any = {};

                props.organization = Property.StaticDropdown({
                    displayName: 'Organization',
                    description: task_type as unknown as string === 'standalone' 
                        ? 'Organization (required when using team or assignees)' 
                        : 'Organization (required when adding users to conversation)',
                    required: false,
                    options: {
                        options: organizationOptions.length > 0 ? organizationOptions : [{ label: 'No organizations found', value: '' }]
                    }
                });

                if (task_type as unknown as string === 'standalone') {
                    // Standalone task fields
                    props.assignment_type = Property.StaticDropdown({
                        displayName: 'Assignment Type',
                        description: 'How to assign this standalone task (either team or specific users required)',
                        required: true,
                        options: {
                            options: [
                                { label: 'Assign to Team', value: 'team' },
                                { label: 'Assign to Specific Users', value: 'users' }
                            ]
                        }
                    });

                    props.team = Property.StaticDropdown({
                        displayName: 'Team',
                        description: 'Team to assign the task to (only for team assignment)',
                        required: false,
                        options: {
                            options: teamOptions.length > 0 ? teamOptions : [{ label: 'Select organization first or no teams found', value: '' }]
                        }
                    });

                    props.assignees_array = Property.Array({
                        displayName: 'Assignees',
                        description: 'Specific users to assign the task to (only for user assignment)',
                        required: false,
                        properties: {
                            user: Property.StaticDropdown({
                                displayName: 'User',
                                description: 'Select user to assign',
                                required: true,
                                options: {
                                    options: userOptions.length > 0 ? userOptions : [{ label: 'Select organization first or no users found', value: '' }]
                                }
                            })
                        }
                    });
                } else {
                    props.conversation_selection = Property.StaticDropdown({
                        displayName: 'Conversation Selection Method',
                        description: 'How to select the parent conversation',
                        required: true,
                        options: {
                            options: [
                                { label: 'Select Existing Conversation', value: 'existing' },
                                { label: 'Find/Create by References', value: 'references' }
                            ]
                        }
                    });

                    props.conversation = Property.StaticDropdown({
                        displayName: 'Parent Conversation',
                        description: 'Conversation to create subtask in (only for existing conversation)',
                        required: false,
                        options: {
                            options: conversationOptions.length > 0 ? conversationOptions : [{ label: 'No conversations found', value: '' }]
                        }
                    });

                    props.references = Property.Array({
                        displayName: 'Message References',
                        description: 'References to find/create parent conversation (only for reference method)',
                        required: false,
                        properties: {
                            reference: Property.ShortText({
                                displayName: 'Reference ID',
                                description: 'Message reference (e.g., <message-id@domain.com>)',
                                required: true,
                            })
                        }
                    });

                    props.conversation_subject = Property.ShortText({
                        displayName: 'New Conversation Subject',
                        description: 'Subject for new conversation if created via references',
                        required: false,
                    });

                    props.assignees_array = Property.Array({
                        displayName: 'Task Assignees',
                        description: 'Users to assign this subtask to',
                        required: false,
                        properties: {
                            user: Property.StaticDropdown({
                                displayName: 'User',
                                description: 'Select user to assign',
                                required: true,
                                options: {
                                    options: userOptions.length > 0 ? userOptions : [{ label: 'Select organization first or no users found', value: '' }]
                                }
                            })
                        }
                    });

                    props.add_users_array = Property.Array({
                        displayName: 'Add Users to Conversation',
                        description: 'Additional users to add to the parent conversation',
                        required: false,
                        properties: {
                            user: Property.StaticDropdown({
                                displayName: 'User',
                                description: 'Select user to add to conversation',
                                required: true,
                                options: {
                                    options: userOptions.length > 0 ? userOptions : [{ label: 'Select organization first or no users found', value: '' }]
                                }
                            })
                        }
                    });
                }

                return props;
            },
        })
    },
    async run(context) {
        const propsValue = context.propsValue as any;
        const {
            task_type,
            title,
            description,
            state,
            due_at
        } = propsValue;

        const taskData: Record<string, any> = {
            title,
        };

        if (description) taskData['description'] = description;
        if (state) taskData['state'] = state;
        if (due_at) taskData['due_at'] = Math.floor(new Date(due_at).getTime() / 1000);

        const taskConfig = propsValue['task_configuration'] || {};
        
        if (taskConfig['organization']) {
            taskData['organization'] = taskConfig['organization'];
        }

        if (task_type === 'standalone') {
            if (taskConfig['assignment_type'] === 'team' && taskConfig['team']) {
                taskData['team'] = taskConfig['team'];
            } else if (taskConfig['assignment_type'] === 'users' && taskConfig['assignees_array'] && Array.isArray(taskConfig['assignees_array'])) {
                taskData['assignees'] = taskConfig['assignees_array'].map((assignee: any) => assignee.user);
            }
        } else if (task_type === 'subtask') {
            taskData['subtask'] = true;
            
            if (taskConfig['conversation_selection'] === 'existing' && taskConfig['conversation']) {
                taskData['conversation'] = taskConfig['conversation'];
            } else if (taskConfig['conversation_selection'] === 'references' && taskConfig['references'] && Array.isArray(taskConfig['references'])) {
                taskData['references'] = taskConfig['references'].map((ref: any) => ref.reference);
                
                if (taskConfig['conversation_subject']) {
                    taskData['conversation_subject'] = taskConfig['conversation_subject'];
                }
            }
            
            if (taskConfig['assignees_array'] && Array.isArray(taskConfig['assignees_array']) && taskConfig['assignees_array'].length > 0) {
                taskData['assignees'] = taskConfig['assignees_array'].map((assignee: any) => assignee.user);
            }
            
            if (taskConfig['add_users_array'] && Array.isArray(taskConfig['add_users_array']) && taskConfig['add_users_array'].length > 0) {
                taskData['add_users'] = taskConfig['add_users_array'].map((user: any) => user.user);
            }
        }

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/tasks',
            body: {
                tasks: taskData  // Fixed: Single object, not array
            },
        });

        return response.body;
    },
});