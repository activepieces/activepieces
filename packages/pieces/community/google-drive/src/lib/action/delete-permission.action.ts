import { Property, createAction } from "@activepieces/pieces-framework";
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { deletePermissionsActionOutputSchema } from '../output-schemas';

export const deletePermission = createAction({
    auth: googleDriveAuth,
    name: 'delete_permissions',
    classification: 'DESTRUCTIVE',
    description: "Remove a person's role from a file or folder.",
    audience: 'human',
    aiMetadata: { description: 'Revokes a specific role from a user (matched by email and role) on a Drive file or folder. Use to unshare or downgrade access for someone. Requires the file/folder ID, the user email, and the role to remove. Idempotent: if no matching permission exists, the call is a no-op.', idempotent: true },
    displayName: 'Remove Access',
    props: {
        fileId: Property.ShortText({
            displayName: 'File or Folder ID',
            description: "The ID from the item's Drive URL or an earlier step.",
            required: true,
            placeholder: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'The person whose access is removed.',
            required: true,
            placeholder: 'name@example.com',
        }),
        permission_name : Property.StaticDropdown({
            displayName: 'Role',
            description: 'The role to remove. Other roles the person has stay.',
            required: true,
            options: {
            options: [
                {
                    label: 'Manager',
                    value: 'organizer',
                },
                {
                    label: 'Content Manager',
                    value: 'fileOrganizer',
                },
                {
                    label: 'Editor',
                    value: 'writer',
                },
                {
                    label: 'Commenter',
                    value: 'commenter',
                },
                {
                    label: 'Viewer',
                    value: 'reader',
                },

            ]
            }
        }),
    },
    outputSchema: deletePermissionsActionOutputSchema,
    async run (context) {
        const [fileId, user_email] = [context.propsValue.fileId, context.propsValue.user_email];
        const authClient = await createGoogleClient(context.auth);

        const drive = googleDrive({ version: 'v3', auth: authClient });
        
        const response_permissions_list = await drive.permissions.list({
            fileId: fileId,
            fields: 'permissions(id, emailAddress, role)',
            supportsAllDrives: true,
        });

        if (response_permissions_list.data.permissions) {

            for (const permission of response_permissions_list.data.permissions) {
                if (permission.emailAddress === user_email && permission.role === context.propsValue.permission_name) {
                    await drive.permissions.delete({
                        fileId: fileId,
                        permissionId: permission.id ? permission.id : '',
                        supportsAllDrives: true,
                    });
                    return {removed: true, message: 'Permission removed'};
                }
            }
        }

        return {removed: false, message: 'Permission not found'};        

    }
});