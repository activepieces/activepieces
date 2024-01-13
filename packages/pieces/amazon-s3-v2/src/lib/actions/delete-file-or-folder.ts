import { Property, createAction } from "@activepieces/pieces-framework";
import { amazonS3Auth } from "../..";
import { createS3 } from "../common";

export const amazons3DeleteFileOrFolder = createAction({
    auth: amazonS3Auth,
    name: 'delete-file-or-folder',
    displayName: "Delete File or Folder",
    description: "Delete files or folders from S3",
    props: {
        path: Property.ShortText({
            displayName: 'File/Folder Paths',
            required: true,
            description: "Paths of the files or folders to delete, separated by commas"
        }),
    },
    async run(context) {
        const { bucket } = context.auth;
        const { path } = context.propsValue;

        const s3 = createS3(context.auth);
        const paths = path.split(',');

        try {
            for (const singlePath of paths) {
                if (singlePath.trim().endsWith('/')) {
                    const listedObjects = await s3.listObjectsV2({
                        Bucket: bucket,
                        Prefix: singlePath.trim()
                    });

                    if (listedObjects.Contents && listedObjects.Contents.length > 0) {
                        const deleteParams = {
                            Bucket: bucket,
                            Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
                        };

                        await s3.deleteObjects(deleteParams);
                    }
                } else {
                    await s3.deleteObject({
                        Bucket: bucket,
                        Key: singlePath.trim()
                    });
                }
            }

            return { success: true, message: "Files/Folders deleted successfully" };
        } catch (err) {
            console.error(err);
            return { success: false, message: 'Error deleting files/folders' };
        }
    },
});
