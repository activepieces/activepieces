import { Property, createAction } from "@activepieces/pieces-framework";
import { amazonS3Auth } from "../..";
import { createS3 } from "../common";

export const amazons3UploadFile = createAction({
    auth: amazonS3Auth,
    name: 'upload-file',
    displayName: "Upload File",
    description: "Upload a File to S3",
    props: {
        file: Property.File({
            displayName: 'File',
            required: true,
        }),
        fileName: Property.ShortText({
            displayName: 'File Name',
            required: false,
            description: "my-file-name (no extension)"
        }),
        uploadPath: Property.ShortText({  // Added property for upload path
            displayName: 'Upload Path',
            required: false,
            description: "Path inside the bucket (e.g., 'folder/subfolder')"
        }),
        acl: Property.StaticDropdown({
            displayName: 'ACL',
            required: false,
            options: {
                options: [
                    // ... [ACL options remain the same]
                    {
                        label: "private",
                        value: "private"
                    },
                    {
                        label: "public-read",
                        value: "public-read"
                    },
                    {
                        label: "public-read-write",
                        value: "public-read-write"
                    },
                    {
                        label: "authenticated-read",
                        value: "authenticated-read"
                    },
                    {
                        label: "aws-exec-read",
                        value: "aws-exec-read"
                    },
                    {
                        label: "bucket-owner-read",
                        value: "bucket-owner-read"
                    },
                    {
                        label: "bucket-owner-full-control",
                        value: "bucket-owner-full-control"
                    }
                ]
            }
        }),
        type: Property.StaticDropdown({
            displayName: 'Type',
            required: true,
            options: {
                options: [
                    // ... [Type options remain the same]
                    {
                        label: "image/png",
                        value: "image/png"
                    },
                    {
                        label: "image/jpeg",
                        value: "image/jpeg"
                    },
                    {
                        label: "image/gif",
                        value: "image/gif"
                    },
                    {
                        label: "audio/mp3",
                        value: "audio/mpeg"
                    },
                    {
                        label: "audio/wav",
                        value: "audio/wav"
                    },
                    {
                        label: "video/mp4",
                        value: "video/mp4"
                    },
                    {
                        label: "application/pdf",
                        value: "application/pdf"
                    },
                    {
                        label: "application/msword",
                        value: "application/msword"
                    },
                    {
                        label: "text/plain",
                        value: "text/plain"
                    },
                    {
                        label: "application/json",
                        value: "application/json"
                    }
                ]
            }
        }),
    },
    async run(context) {
        const { bucket } = context.auth;
        const { file, fileName, uploadPath, acl, type } = context.propsValue;

        const s3 = createS3(context.auth);

          // Determine the file extension
          let extension;
          if (type === "audio/mpeg") {
              extension = "mp3"; // Set extension to .mp3 for audio/mpeg type
          } else {
              extension = type.split("/").pop();
          }

        // Use the provided fileName or generate a new one
        const baseFileName = fileName ? `${fileName}.${extension}` : `file-${Date.now()}.${extension}`;

        // Include the upload path if provided
        const finalFileName = uploadPath ? `${uploadPath}/${baseFileName}` : baseFileName;

        const uploadResponse = await s3.putObject({
            Bucket: bucket,
            Key: finalFileName,
            ACL: acl,
            ContentType: type,
            Body: file.data,
        });

        // Construct the file URL
        const fileUrl = `https://${bucket}.s3.${context.auth.region}.amazonaws.com/${finalFileName}`;


        return {
            fileName: finalFileName,
            fileUrl: fileUrl, // Added line to return the file URL
            etag: uploadResponse.ETag,
        };
    },
});