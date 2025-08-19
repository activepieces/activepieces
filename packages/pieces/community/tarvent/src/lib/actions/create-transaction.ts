import { tarventAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient, tarventCommon } from '../common';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';

export const createTransaction = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_transaction',
  displayName: 'Send A Transactional Email',
  description: 'Sends a transactional email. NOTE: This will use your email API credits.',
  props: {
    groupName: tarventCommon.txGroupName(false, 'Choose an existing group name or use "Custom" to enter a new group name. This name is used for reporting.'),
    fromEmail: Property.ShortText({
      displayName: 'From email',
      description: 'Enter who this transaction is from.',
      required: true,
      defaultValue: ''
    }),
    fromName: Property.ShortText({
      displayName: 'From name',
      description: 'Enter a friendly name for who this transaction is from.',
      required: false,
      defaultValue: ''
    }),
    toEmail: Property.ShortText({
      displayName: 'To email',
      description: 'Enter the email that the transaction should be sent to.',
      required: true,
      defaultValue: ''
    }),
    ccEmail: Property.Array({
      displayName: 'CC Emails',
      description: 'Enter emails that this transaction should be CC\'d to.',
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: false,
          defaultValue: ''
        })
      },
      required: false,
      defaultValue: [],
    }),
    bccEmail: Property.Array({
      displayName: 'BCC Emails',
      description: 'Enter emails that this transaction should be BCC\'d to.',
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: false,
          defaultValue: ''
        })
      },
      required: false,
      defaultValue: [],
    }),
    subject: Property.ShortText({
      displayName: 'Subject line',
      description: 'Enter a subject line for the transaction.',
      required: true,
      defaultValue: ''
    }),
    replyToEmail: Property.ShortText({
      displayName: 'Reply to email',
      description: 'Enter the email that the replies should go to.',
      required: true,
      defaultValue: ''
    }),
    replyToName: Property.ShortText({
      displayName: 'Reply to name',
      description: 'Enter a friendly name the replies should go to.',
      required: false,
      defaultValue: ''
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'NOTE: Variable names (first column) can have Letters, numbers, underscores, and hyphens. Any other characters in the first column only will be removed.',
      required: false,
      defaultValue: '',
    }),
    templateId: tarventCommon.templateId(false, 'Select which template you\'d like to used for this transaction.'),
    mimeType: Property.StaticDropdown({
      displayName: 'Message type',
      description: 'If "Template" is specified, this will be ignored..',
      required: false,
      options: {
        options: [
          {
            label: 'HTML',

            value: 'HTML',
          },
          {
            label: 'Plain text',
            value: 'TEXT',
          },
        ],
      }
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'To merge in variables, you must use the syntax [[Tx.VariableData.VariableName]] (ex. Variable name is FirstName, merge syntax would be [[Tx.VariableData.FirstName]]) If "Template" is specified, this will be ignored.',
      required: false,
    }),
    ignoreSuppressCheck: Property.StaticDropdown({
      displayName: 'Ignore suppression filters',
      description: 'Select if the suppression filters on your account should be ignored for this transaction.',
      required: true,
      options: {
        options: [
          {
            label: 'Ignore',

            value: 'true',
          },
          {
            label: 'Do not ignore',
            value: 'false',
          },
        ],
      },
      defaultValue: 'false'
    })
  },
  async run(context) {
    const { groupName, fromEmail, fromName, toEmail, ccEmail, bccEmail, subject, replyToEmail, replyToName, variables, templateId, mimeType, content, ignoreSuppressCheck } = context.propsValue;

    await propsValidation.validateZod(context.propsValue, {
      groupName: z.string().max(100, 'Group name has to be equal to or less than 100 characters.').optional(),
      fromEmail: z.string().max(320, 'From email has to be equal to or less than 320 characters.'),
      fromName: z.string().max(255, 'From name has to be equal to or less than 255 characters.').optional(),
      subject: z.string().max(500, 'Subject has to be equal to or less than 500 characters.'),
      replyToEmail: z.string().max(320, 'Reply to email has to be equal to or less than 320 characters.'),
      replyToName: z.string().max(255, 'Reply to name has to be equal to or less than 255 characters.').optional(),
    });

    const client = makeClient(context.auth);
    return await client.createTransaction(groupName, fromEmail, fromName, toEmail, ccEmail, bccEmail, subject, replyToEmail, replyToName, variables, templateId, mimeType, content, ignoreSuppressCheck);
  },
});
