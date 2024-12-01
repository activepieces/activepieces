import { Property, createAction } from "@activepieces/pieces-framework";
import { googleDriveAuth } from "../../";
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const addPermission = createAction({
    auth: googleDriveAuth,
    name: 'update_permissions',
    description: 'Update permissions for a file or folder',
    displayName: 'Update permissions',
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
            description: 'The role to grant to user. See more at: https://developers.google.com/drive/api/guides/ref-roles',
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
        send_invitation_email: Property.Checkbox({
            displayName: 'Send invitation email',
            description: 'Send an email to the user to notify them of the new permissions',
            required: true,
        }),

       },

    async run(context) {
        const [fileId, user_email, permission_name, send_invitation_email] = [context.propsValue.fileId, context.propsValue.user_email, context.propsValue.permission_name, context.propsValue.send_invitation_email];

        const authClient = new OAuth2Client();
        authClient.setCredentials(context.auth)

        const drive = google.drive({ version: 'v3', auth: authClient });

        const permission = { 'type': 'user', 'role': permission_name, 'emailAddress': user_email };

        const result = await drive.permissions.create({
            requestBody: permission,
            fileId: fileId,
            sendNotificationEmail: send_invitation_email
        });

        return result.data;
    }
});
