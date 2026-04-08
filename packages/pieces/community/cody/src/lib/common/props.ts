import { Property } from '@activepieces/pieces-framework';
import { codyClient } from './client';
import { codyAuth } from '../..';

export const folderIdDropdown = Property.Dropdown({
    auth: codyAuth,
    displayName: 'Folder',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Cody AI account first.',
                options: [],
            };
        }
        try {
            // Note: Comment removed as the endpoint is now confirmed.
            const folders = await codyClient.listFolders(auth);
            if (folders.length === 0) {
                    return {
                    disabled: true,
                    options: [],
                    placeholder: "No folders found. Please create a folder in Cody first.",
                };
            }
            return {
                disabled: false,
                options: folders.map((folder) => ({
                    label: folder.name,
                    value: folder.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error listing folders. Check connection or API key permissions.",
            };
        }
    },
});

export const conversationIdDropdown = Property.Dropdown({
    displayName: 'Conversation',
    auth: codyAuth,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Cody AI account first.',
                options: [],
            };
        }
        try {
            const conversations = await codyClient.listConversations(auth);
            if (conversations.length === 0) {
                    return {
                    disabled: true,
                    options: [],
                    placeholder: "No conversations found. Please create one in Cody first.",
                };
            }
            return {
                disabled: false,
                options: conversations.map((convo) => ({
                    label: convo.name,
                    value: convo.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error listing conversations.",
            };
        }
    },
});

// Add the new dropdown for bots
export const botIdDropdown = Property.Dropdown({
    auth: codyAuth,
    displayName: 'Bot',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
        if (!auth) {
            return {
                disabled: true,
                placeholder: 'Connect your Cody AI account first.',
                options: [],
            };
        }
        try {
            const bots = await codyClient.listBots(auth);
            if (bots.length === 0) {
                    return {
                    disabled: true,
                    options: [],
                    placeholder: "No bots found. Please create one in Cody first.",
                };
            }
            return {
                disabled: false,
                options: bots.map((bot) => ({
                    label: bot.name,
                    value: bot.id,
                })),
            };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Error listing bots.",
            };
        }
    },
});