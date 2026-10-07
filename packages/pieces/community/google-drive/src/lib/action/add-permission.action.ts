import { Property, createAction } from "@activepieces/pieces-framework";
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { common } from "../common";
import { updatePermissionsActionOutputSchema } from '../output-schemas';

export const addPermission = createAction({
    auth: googleDriveAuth,
    name: 'update_permissions',
    classification: 'WRITE',
    description: 'Give a person a role on a file or folder by email.',
    audience: 'human',
    aiMetadata: { description: 'Grants a specified role (reader, commenter, writer, fileOrganizer, or organizer) on a Drive file or folder to a user identified by email, optionally sending a notification email. Use to share a resource with a person. Requires the file/folder ID and target email. Not idempotent: each call creates a new permission grant.', idempotent: false },
    displayName: 'Share File or Folder',
    props: {
        fileId: Property.ShortText({
            displayName: 'File or Folder ID',
            description: "The ID from the item's Drive URL or an earlier step.",
            required: true,
            placeholder: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
        }),
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'The person who receives the access.',
            required: true,
            placeholder: 'name@example.com',
        }),
        permission_name : Property.StaticDropdown({
            displayName: 'Role',
            description: 'What the person can do. Manager roles apply to shared drives only.',
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
        send_invitation_email: Property.Checkbox({
            displayName: 'Send Invitation Email',
            description: 'Email the person that they now have access.',
            required: true,
        }),
        include_team_drives: common.properties.include_team_drives,
       },
    outputSchema: updatePermissionsActionOutputSchema,

    async run(context) {
        const {fileId, user_email, permission_name, send_invitation_email,include_team_drives} = context.propsValue;

        const authClient = await createGoogleClient(context.auth);

        const drive = googleDrive({ version: 'v3', auth: authClient });

        const permission = { 'type': 'user', 'role': permission_name, 'emailAddress': user_email };

        const result = await drive.permissions.create({
            requestBody: permission,
            fileId: fileId,
            sendNotificationEmail: send_invitation_email,
            supportsAllDrives: include_team_drives,
        });

        return result.data;
    }
});
