import { createPiece, OAuth2Property, OAuth2Props, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { onenoteApiAuth } from "../../index";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const newNoteInSection = createTrigger({
    name: 'new_note_in_section',
    displayName: 'New Note in Section',
    description: 'Fires when a new note (page) is created in a specified notebook and section.',
    auth: onenoteApiAuth,
    type: TriggerStrategy.POLLING,
    props: {
        notebook_id: Property.Dropdown({
            displayName: 'Notebook',
            description: 'Select the notebook',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: 'https://graph.microsoft.com/v1.0/me/onenote/notebooks',
                    headers: {
                        'Authorization': `Bearer ${(auth as { access_token: string }).access_token}`
                    }
                });
                return (response.body.value ?? []).map((notebook: { id: string; displayName: string }) => ({
                    label: notebook.displayName,
                    value: notebook.id
                }));
            }
        }),
        section_id: Property.Dropdown({
            displayName: 'Section',
            description: 'Select the section to watch for new notes',
            required: true,
            refreshers: ['notebook_id'],
            options: async ({ auth, notebook_id }) => {
                if (!notebook_id) return [];
                const response = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: `https://graph.microsoft.com/v1.0/me/onenote/notebooks/${notebook_id}/sections`,
                    headers: {
                        'Authorization': `Bearer ${(auth as { access_token: string }).access_token}`
                    }
                });
                return (response.body.value ?? []).map((section: { id: string; displayName: string }) => ({
                    label: section.displayName,
                    value: section.id
                }));
            }
        })
    },
    async onEnable(context) {
        await context.store.put('sectionId', context.propsValue.section_id);
        await context.store.put('lastCheckTime', new Date().toISOString());
    },
    async run(context) {
        const sectionId = await context.store.get<string>('sectionId');
        const lastCheckTime = await context.store.get<string>('lastCheckTime');
        if (!sectionId) return [];

        // Get pages from the section
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/me/onenote/sections/${sectionId}/pages?$orderby=createdDateTime desc&$top=20`,
            headers: {
                'Authorization': `Bearer ${context.auth.access_token}`,
                'Accept': 'application/json'
            }
        });

        const currentTime = new Date().toISOString();

        // Filter pages created after the last check
        const newPages = (response.body.value ?? []).filter((page: any) => {
            if (!page.createdDateTime) return false;
            const pageCreatedTime = new Date(page.createdDateTime);
            const lastCheck = new Date(lastCheckTime || '');
            return pageCreatedTime > lastCheck;
        });

        // Update the last check time
        await context.store.put('lastCheckTime', currentTime);

        return newPages.map((page: any) => ({
            id: page.id,
            title: page.title,
            contentUrl: page.contentUrl,
            createdDateTime: page.createdDateTime,
            lastModifiedDateTime: page.lastModifiedDateTime,
            links: page.links,
        }));
    },
    async onDisable(context) {
        await context.store.delete('sectionId');
        await context.store.delete('lastCheckTime');
    },
    sampleData: {
        id: "page-id-123",
        title: "New Note",
        contentUrl: "https://graph.microsoft.com/v1.0/me/onenote/pages/page-id-123/content",
        createdDateTime: "2024-01-23T10:37:00Z",
        lastModifiedDateTime: "2024-01-23T10:37:00Z",
        links: {
            oneNoteClientUrl: "https://onenote.com/notebookId/page-id-123",
            oneNoteWebUrl: "https://www.onenote.com/notebookId/page-id-123"
        }
    }
});

export const onenoteApi = createPiece({
    auth: onenoteApiAuth,
    displayName: "OneNote",
    description: "Integrate with Microsoft OneNote",
    triggers: [
        newNoteInSection
    ],
    actions: []
});
