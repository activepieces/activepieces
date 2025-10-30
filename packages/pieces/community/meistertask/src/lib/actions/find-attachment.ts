import { createAction, Property } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskApiService } from '../common/requests';
import { taskDropdown } from '../common/props';

export const findAttachment = createAction({
  auth: meisterTaskAuth,
  name: 'findAttachment',
  displayName: 'Find Attachment',
  description: 'Finds an attachment by searching',
  props: {
    taskId: taskDropdown({
      displayName: 'Select Task',
      description: 'Select a task',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'The name of the attachment to search for',
      required: true,
    }),
  },
  async run(context) {
    const { taskId, name } = context.propsValue;

    const response = await meisterTaskApiService.fetchAttachments({
      auth: context.auth,
      taskId,
    });

    const matchingItems = response.filter(
      (item: any) => item.name.toLowerCase() === name.toLowerCase()
    );

    if (matchingItems.length === 0) {
      return {
        success: false,
        message: `No attachments found with name: ${name}`,
        data: null,
        count: 0,
      };
    }

    return {
      success: true,
      data: matchingItems,
      count: matchingItems.length,
      message:
        matchingItems.length === 1
          ? 'Found 1 matching attachment'
          : `Found ${matchingItems.length} matching attachments`,
    };
  },
});
