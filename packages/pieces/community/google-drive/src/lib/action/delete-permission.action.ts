import { Property, createAction } from "@activepieces/pieces-framework";
import { googleDriveAuth } from "../../";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const deletePermission = createAction({
    auth: googleDriveAuth,
    name: 'delete_permissions',
    description: 'Removes a role from an user for a file or folder',
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
        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)

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