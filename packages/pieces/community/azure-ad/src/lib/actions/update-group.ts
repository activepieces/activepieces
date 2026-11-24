import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { azureAdAuth } from '../auth';
import { callGraphApi, stripODataKeys, GROUP_ITEM_SELECT, groupDropdown, groupItemFields } from '../common';

export const updateGroupAction = createAction({
    auth: azureAdAuth,
    name: 'update_group',
    classification: 'WRITE',
    displayName: 'Update Group',
    description: 'Changes a group\'s name, description, mail nickname or visibility. Only the fields you fill in change.',
    audience: 'both',
    aiMetadata: {
        description:
            'Updates an existing Microsoft Entra ID group: displayName, description, mailNickname and visibility ("Public" or "Private", Microsoft 365 groups only). Omitted fields are left unchanged; set clearDescription to true to empty the description. At least one change is required. Returns the group as stored after the update. Idempotent: re-applying the same values leaves the same state.',
        idempotent: true,
    },
    outputSchema: { fields: groupItemFields },
    props: {
        groupId: groupDropdown,
        displayName: Property.ShortText({
            displayName: 'Display Name',
            required: false,
            placeholder: 'e.g. Finance Team',
        }),
        description: Property.ShortText({
            displayName: 'Description',
            required: false,
            placeholder: 'e.g. Members of the finance team',
        }),
        mailNickname: Property.ShortText({
            displayName: 'Mail Nickname',
            description: 'Mail alias without the domain. Must be unique.',
            required: false,
            placeholder: 'e.g. finance-team',
            advanced: true,
        }),
        visibility: Property.StaticDropdown({
            displayName: 'Visibility',
            description: 'Microsoft 365 groups only. Leave empty to keep the current visibility.',
            required: false,
            display: 'cards',
            options: {
                disabled: false,
                options: [
                    { label: 'Public', value: 'Public', description: 'Anyone in the organization can join and see content' },
                    { label: 'Private', value: 'Private', description: 'Only owners can add members' },
                ],
            },
            advanced: true,
        }),
        clearDescription: Property.Checkbox({
            displayName: 'Clear Description',
            description: 'Remove the current description. Ignored when Description is filled in.',
            required: false,
            defaultValue: false,
            advanced: true,
        }),
    },
    async run(context) {
        const { groupId, displayName, description, mailNickname, visibility, clearDescription } = context.propsValue;
        const id = String(groupId ?? '').trim();
        if (id === '') throw new Error('Select the group to update.');
        const body: Record<string, unknown> = {};
        if (typeof displayName === 'string' && displayName.trim() !== '') body['displayName'] = displayName.trim();
        if (typeof description === 'string' && description.trim() !== '') body['description'] = description.trim();
        else if (clearDescription === true) body['description'] = null;
        if (typeof mailNickname === 'string' && mailNickname.trim() !== '') body['mailNickname'] = mailNickname.trim();
        if (visibility !== undefined && visibility !== null && visibility !== '') {
            if (visibility !== 'Public' && visibility !== 'Private') {
                throw new Error('Visibility must be "Public" or "Private".');
            }
            body['visibility'] = visibility;
        }
        if (Object.keys(body).length === 0) {
            throw new Error('Provide at least one field to update.');
        }
        const url = `/groups/${encodeURIComponent(id)}`;
        await callGraphApi(context.auth.access_token, { method: HttpMethod.PATCH, url, body });
        const result = await callGraphApi<Record<string, unknown>>(context.auth.access_token, {
            method: HttpMethod.GET,
            url,
            query: { $select: GROUP_ITEM_SELECT },
        });
        return stripODataKeys(result);
    },
});
