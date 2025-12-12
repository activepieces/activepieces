import { createAction, Property } from '@activepieces/pieces-framework';
import { firestoreAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { convertToFirestoreValues } from '../common/props';

interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
  nullValue?: string;
}

interface FirestoreDocument {
  fields: Record<string, FirestoreValue>;
}

export const createFirestoreDocument = createAction({
  auth: firestoreAuth,
  name: 'createFirestoreDocument',
  displayName: 'Create Firestore Document',
  description: 'Create a new document in a Firestore collection',
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
    collectionPath: Property.ShortText({
      displayName: 'Collection Path',
      description:
        'Path to the collection (e.g., "users" or "users/user1/posts")',
      required: true,
    }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description:
        'Optional document ID. If not specified, an ID will be auto-generated',
      required: false,
    }),
    documentData: Property.Object({
      displayName: 'Document Data',
      description:
        'Data to store in the document (e.g., {"name": "John", "age": 30})',
      required: true,
    }),
  },
  async run(context) {
    const { projectId, databaseId, collectionPath, documentId, documentData } =
      context.propsValue;

    const firestoreFields = convertToFirestoreValues(documentData);

    const parent = `projects/${projectId}/databases/${databaseId}/documents`;
    const collectionId = collectionPath.split('/').pop();
    const parentPath = collectionPath.includes('/')
      ? parent +
        '/' +
        collectionPath.substring(0, collectionPath.lastIndexOf('/'))
      : parent;

    let url = `https://firestore.googleapis.com/v1/${parentPath}/${collectionId}`;
    if (documentId) {
      url += `?documentId=${documentId}`;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
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
