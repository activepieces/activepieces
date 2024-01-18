import { createAction, Property } from '@activepieces/pieces-framework';
import { getContacts, getTask, getTasks, getUsers, LeadConnectorTaskStatus, updateTask } from '../common';
import { leadConnectorAuth } from '../..';

export const updateTaskAction = createAction({
    auth: leadConnectorAuth,
    name: 'update_task',
    displayName: 'Update Task',
    description: 'Update a task.',
    props: {
        contact: Property.Dropdown({
            displayName: 'Contact',
            description: 'The contact to use.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: []
                }

                const contacts = await getContacts(auth as string);

                return {
                    options: contacts.map(contact => {
                        return {
                            label: contact.contactName,
                            value: contact.id
                        }
                    })
                }
            }
        }),
        task: Property.Dropdown({
            displayName: 'Task',
            required: true,
            refreshers: ['contact'],
            options: async ({ auth, contact }) => {
                if (!auth || !contact) return {
                    disabled: true,
                    options: []
                }

                const tasks = await getTasks(auth as string, contact as string)
                return {
                    options: tasks.map((task: any) => {
                        return {
                            label: task.title,
                            value: task.id
                        }
                    })
                }
            }
        }),
        title: Property.ShortText({
            displayName: 'Title',
            required: false
        }),
        dueDate: Property.DateTime({
            displayName: 'Due Date',
            required: false
        }),
        description: Property.ShortText({
            displayName: 'Description',
            required: false
        }),
        assignedTo: Property.Dropdown({
            displayName: 'Assigned To',
            required: false,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) return {
                    disabled: true,
                    options: []
                }

                const users = await getUsers(auth as string);
                return {
                    options: users.map((user: any) => {
                        return {
                            label: `${user.firstName} ${user.lastName}`,
                            value: user.id
                        }
                    })
                }
            }
        }),
        status: Property.Dropdown({
            displayName: 'Status',
            required: false,
            refreshers: [],
            options: async () => {
                const statuses = Object.values(LeadConnectorTaskStatus);

                return {
                    options: statuses.map((status) => {
                        return {
                            label: status.charAt(0).toUpperCase() + status.slice(1),
                            value: status
                        }
                    })
                }
            }
        })
    },

    async run({ auth, propsValue }) {
        const { contact, task, title, dueDate, description, assignedTo, status } = propsValue;

        let originalData: any;
        if (!title || !dueDate) originalData = await getTask(auth, contact, task);

        return await updateTask(auth, contact, task, {
            title: title ?? originalData.title,
            // Needs to be ISO string without milliseconds
            dueDate: dueDate ? formatDate(dueDate) : formatDate(originalData.dueDate),
            description: description,
            assignedTo: assignedTo,
            status: status
        });
    },
});

function formatDate(date: string) {
    return new Date(date).toISOString().split('.')[0] + 'Z'
}