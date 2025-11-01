import { createAction, Property } from '@activepieces/pieces-framework';
import { myCaseAuth } from '../common/auth';
import { myCaseApiService } from '../common/requests';
import { multiStaffDropdown } from '../common/props';

export const createDocument = createAction({
  auth: myCaseAuth,
  name: 'createDocument',
  displayName: 'Create Firm Document',
  description: 'Creates a new document',
  props: {
    path: Property.ShortText({
      displayName: 'Document Path',
      description: 'The relative path including document name. Folders will be created automatically if they don\'t exist',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The filename of the physical file including extension',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of this document',
      required: false,
    }),
    assigned_date: Property.DateTime({
      displayName: 'Assigned Date',
      description: 'The assigned date of this document',
      required: false,
    }),
    staff: multiStaffDropdown({
      description: 'Select staff members to share this document with',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const payload: any = {
      path: propsValue.path,
      filename: propsValue.filename,
      description: propsValue.description,
      assigned_date: propsValue.assigned_date,
    };

    if (propsValue.staff && Array.isArray(propsValue.staff) && propsValue.staff.length > 0) {
      payload.staff = propsValue.staff.map((staffId) => ({ id: staffId }));
    }

    return await myCaseApiService.createDocument({
      accessToken: auth.access_token,
      payload,
    });
  },
});