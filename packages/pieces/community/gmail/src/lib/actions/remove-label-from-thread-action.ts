import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { GmailRequests } from '../common/data';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  description: 'Remove one or more labels from all messages in a thread',
  displayName: 'Remove Label from Thread',
  props: {
    thread_id: GmailProps.thread,
    labels_to_remove: Property.MultiSelectDropdown({
      displayName: 'Labels to Remove',
      description: 'Select the labels to remove from all messages in the thread',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Gmail account first',
            options: [],
          };
        }

        try {
          const labelsResponse = await GmailRequests.getLabels(auth as any);
          const labels = labelsResponse.body.labels || [];
          
          const removableLabels = labels.filter(label => {
            return label.type === 'user' || 
                   ['INBOX', 'UNREAD', 'STARRED', 'IMPORTANT'].includes(label.id);
          });

          return {
            disabled: false,
            options: removableLabels.map(label => ({
              label: label.name,
              value: JSON.stringify({ id: label.id, name: label.name }),
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Failed to load labels',
            options: [],
          };
        }
      },
    }),
    verify_thread_exists: Property.Checkbox({
      displayName: 'Verify Thread Exists',
      description: 'Check if the thread exists before removing labels',
      required: true,
      defaultValue: true,
    }),
    force_remove: Property.Checkbox({
      displayName: 'Force Remove',
      description: 'Remove labels even if they are not currently applied to the thread',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    let originalThread = null;
    let threadLabels: string[] = [];

    if (context.propsValue.verify_thread_exists) {
      try {
        const threadResponse = await gmail.users.threads.get({
          userId: 'me',
          id: context.propsValue.thread_id,
          format: 'minimal',
        });
        originalThread = threadResponse.data;
        
        const allLabels = new Set<string>();
        (originalThread.messages || []).forEach(message => {
          (message.labelIds || []).forEach(labelId => allLabels.add(labelId));
        });
        threadLabels = Array.from(allLabels);
      } catch (error) {
        throw new Error(`Thread with ID ${context.propsValue.thread_id} not found or inaccessible`);
      }
    }

    const selectedLabels = context.propsValue.labels_to_remove.map((labelStr: string) => {
      try {
        return JSON.parse(labelStr) as GmailLabel;
      } catch {
        throw new Error(`Invalid label format: ${labelStr}`);
      }
    });
    const labelIdsToRemove = selectedLabels.map(label => label.id);

    if (labelIdsToRemove.length === 0) {
      throw new Error('At least one label must be selected to remove from the thread');
    }

    if (labelIdsToRemove.length > 100) {
      throw new Error('Cannot remove more than 100 labels from a thread in a single request');
    }

    if (!context.propsValue.force_remove && originalThread) {
      const labelsNotOnThread = labelIdsToRemove.filter(labelId => !threadLabels.includes(labelId));
      if (labelsNotOnThread.length > 0) {
        const allLabelsResponse = await GmailRequests.getLabels(context.auth);
        const labelMap = allLabelsResponse.body.labels.reduce((acc: { [key: string]: string }, label) => {
          acc[label.id] = label.name;
          return acc;
        }, {});
        
        const missingLabelNames = labelsNotOnThread.map(id => labelMap[id] || id);
        throw new Error(`The following labels are not currently applied to this thread: ${missingLabelNames.join(', ')}. Use 'Force Remove' to override this check.`);
      }
    }

    try {
      const modifyResponse = await gmail.users.threads.modify({
        userId: 'me',
        id: context.propsValue.thread_id,
        requestBody: {
          removeLabelIds: labelIdsToRemove,
        },
      });

      const updatedThread = await gmail.users.threads.get({
        userId: 'me',
        id: context.propsValue.thread_id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date'],
      });

      const updatedThreadLabels = new Set<string>();
      (updatedThread.data.messages || []).forEach(message => {
        (message.labelIds || []).forEach(labelId => updatedThreadLabels.add(labelId));
      });

      const allLabelsResponse = await GmailRequests.getLabels(context.auth);
      const labelMap = allLabelsResponse.body.labels.reduce((acc: { [key: string]: string }, label) => {
        acc[label.id] = label.name;
        return acc;
      }, {});

      const removedLabelNames = labelIdsToRemove.map(id => labelMap[id] || id);
      const currentLabelNames = Array.from(updatedThreadLabels).map(id => labelMap[id] || id);

      const actuallyRemovedLabels = labelIdsToRemove.filter(labelId => 
        threadLabels.includes(labelId) && !updatedThreadLabels.has(labelId)
      );
      const actuallyRemovedLabelNames = actuallyRemovedLabels.map(id => labelMap[id] || id);

      const firstMessage = updatedThread.data.messages?.[0];
      const headers = firstMessage?.payload?.headers || [];
      const headerMap = headers.reduce((acc: { [key: string]: string }, header) => {
        if (header.name && header.value) {
          acc[header.name.toLowerCase()] = header.value;
        }
        return acc;
      }, {});

      return {
        success: true,
        thread: {
          id: context.propsValue.thread_id,
          subject: headerMap['subject'] || '',
          snippet: updatedThread.data.snippet || '',
          messageCount: (updatedThread.data.messages || []).length,
          historyId: updatedThread.data.historyId,
        },
        labels: {
          requested: {
            ids: labelIdsToRemove,
            names: removedLabelNames,
            count: labelIdsToRemove.length,
          },
          actuallyRemoved: {
            ids: actuallyRemovedLabels,
            names: actuallyRemovedLabelNames,
            count: actuallyRemovedLabels.length,
          },
          current: {
            ids: Array.from(updatedThreadLabels),
            names: currentLabelNames,
            count: updatedThreadLabels.size,
          },
        },
        operation: {
          type: 'remove_labels_from_thread',
          timestamp: new Date().toISOString(),
          threadVerified: context.propsValue.verify_thread_exists,
          forceRemove: context.propsValue.force_remove,
          messagesAffected: (updatedThread.data.messages || []).length,
        },
        originalThread: originalThread ? {
          messageCount: (originalThread.messages || []).length,
          snippet: originalThread.snippet || '',
          labelIds: threadLabels,
        } : null,
        messages: (updatedThread.data.messages || []).map(message => ({
          id: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds || [],
          snippet: message.snippet || '',
        })),
      };
    } catch (error: any) {
      if (error.code === 404) {
        throw new Error(`Thread with ID ${context.propsValue.thread_id} not found`);
      } else if (error.code === 400) {
        if (error.message?.includes('Invalid label')) {
          throw new Error('One or more selected labels are invalid or no longer exist');
        } else if (error.message?.includes('Invalid thread')) {
          throw new Error('Invalid thread ID format or thread no longer exists');
        }
        throw new Error(`Invalid request: ${error.message}`);
      } else if (error.code === 403) {
        throw new Error('Insufficient permissions to modify thread labels. Ensure the gmail.modify scope is granted.');
      } else if (error.code === 429) {
        throw new Error('Gmail API rate limit exceeded. Please try again later.');
      } else if (error.code === 500) {
        throw new Error('Gmail API server error. Please try again later.');
      }
      
      throw new Error(`Failed to remove labels from thread: ${error.message}`);
    }
  },
}); 