import { Property, createAction } from "@activepieces/pieces-framework";
import { googleDriveAuth, createGoogleClient } from '../auth';
import { google } from 'googleapis';

export const deletePermission = createAction({
    auth: googleDriveAuth,
    name: 'delete_permissions',
    description: 'Removes a role from an user for a file or folder',
    audience: 'both',
    aiMetadata: { description: 'Revokes a specific role from a user (matched by email and role) on a Drive file or folder. Use to unshare or downgrade access for someone. Requires the file/folder ID, the user email, and the role to remove. Idempotent: if no matching permission exists, the call is a no-op.', idempotent: true },
    displayName: 'Delete permissions',
    props: {
        fileId: Property.ShortText({
            displayName: 'File or Folder ID',
            description: 'The ID of the file or folder to update permissions for',
            required: true,
        }),
        user_email: Property.ShortText({
            displayName: 'User email',
            description: 'The email address of the user to update permissions for',
            required: true,
        }),  
        permission_name : Property.StaticDropdown({
            displayName: 'Role',
            description: 'The role to remove from user.',
            required: true,
            options: {
            options: [
                {
                    label: 'Organizer',
                    value: 'organizer',
                },
                {
                    label: 'File Organizer',
                    value: 'fileOrganizer',
                },
                {
                    label: 'Writer',
                    value: 'writer',
                },
                {
                    label: 'Commenter',
                    value: 'commenter',
                },
                {
                    label: 'Reader',
                    value: 'reader',
                },
                
            ]
            }
        }),
    },
    async run (context) {
        const [fileId, user_email] = [context.propsValue.fileId, context.propsValue.user_email];
        const authClient = await createGoogleClient(context.auth);

        const drive = google.drive({ version: 'v3', auth: authClient });
        
        const response_permissions_list = await drive.permissions.list({
            fileId: fileId,
            fields: 'permissions(id, emailAddress, role)',
            
        });

        if (response_permissions_list.data.permissions) {

            for (const permission of response_permissions_list.data.permissions) {
                if (permission.emailAddress === user_email && permission.role === context.propsValue.permission_name) {
                    await drive.permissions.delete({
                        fileId: fileId,
                        permissionId: permission.id ? permission.id : '',
                    });
                    return {removed: true, message: 'Permission removed'};
                }
            }
        }

        return {removed: false, message: 'Permission not found'};        

    }
});