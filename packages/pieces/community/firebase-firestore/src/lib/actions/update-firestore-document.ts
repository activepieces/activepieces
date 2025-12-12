import { createAction, Property } from '@activepieces/pieces-framework';
import { firestoreAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { convertToFirestoreValues } from '../common/props';



export const updateFirestoreDocument = createAction({
  auth: firestoreAuth,
  name: 'updateFirestoreDocument',
  displayName: 'Update Firestore Document',
  description: 'Update specific fields or replace an entire Firestore document',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Firebase project ID',
      required: true,
    }),
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      description: 'Database ID (default is "(default)")',
      required: false,
      defaultValue: '(default)',
    }),
    documentPath: Property.ShortText({
      displayName: 'Document Path',
      description:
        'Full path to the document (e.g., "users/user1" or "users/user1/posts/post1")',
      required: true,
    }),
    updateMode: Property.StaticDropdown({
      displayName: 'Update Mode',
      description:
        'Choose whether to update specific fields or replace the entire document',
      required: true,
      defaultValue: 'specific-fields',
      options: {
        options: [
          {
            label: 'Update Specific Fields',
            value: 'specific-fields',
          },
          {
            label: 'Replace Entire Document',
            value: 'replace-all',
          },
        ],
      },
    }),
    documentData: Property.Json({
      displayName: 'Document Data',
      description: 'Fields to update or new document content',
      required: true,
    }),
    fieldPaths: Property.LongText({
      displayName: 'Field Paths',
      description:
        'When using "Update Specific Fields" mode, specify which fields to update (one per line, e.g., "name" or "address.city")',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      databaseId,
      documentPath,
      updateMode,
      documentData,
      fieldPaths,
    } = context.propsValue;

    const firestoreFields = convertToFirestoreValues(documentData);

    const documentName = `projects/${projectId}/databases/${databaseId}/documents/${documentPath}`;
    let url = `https://firestore.googleapis.com/v1/${documentName}`;

    if (updateMode === 'specific-fields' && fieldPaths) {
      const paths = fieldPaths
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      if (paths.length > 0) {
        const maskParams = paths
          .map((p) => `updateMask.fieldPaths=${encodeURIComponent(p)}`)
          .join('&');
        url += `?${maskParams}`;
      }
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: url,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: firestoreFields,
      }),
    });

    return response.body;
  },
});
