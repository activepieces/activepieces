import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { TarventApiError, TarventCredentials, tarventTransport } from '../common/transport';
import { tarventOutputSchemas } from '../output-schemas';

export const createTransaction = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_transaction',
  classification: 'WRITE',
  displayName: 'Send A Transactional Email',
  description: 'Sends a transactional email. NOTE: This uses your Tarvent email API credits (a paid add-on).',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends one transactional email through Tarvent, optionally ignoring the account suppression filters. Human-only; agents use the AI variant, which always respects suppression filters. Not idempotent: every call sends another email.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.transactionSent,
  props: {
    groupName: tarventCommon.txGroupName(false, 'Choose an existing group name or use "Custom" to enter a new group name. This name is used for reporting.'),
    fromEmail: Property.ShortText({
      displayName: 'From email',
      description: 'Enter who this transaction is from.',
      required: true,
    }),
    fromName: Property.ShortText({
      displayName: 'From name',
      description: 'Enter a friendly name for who this transaction is from.',
      required: false,
    }),
    toEmail: Property.ShortText({
      displayName: 'To email',
      description: 'Enter the email that the transaction should be sent to.',
      required: true,
    }),
    ccEmail: Property.Array({
      displayName: 'CC Emails',
      description: 'Enter emails that this transaction should be CC\'d to.',
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: false,
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
        })
      },
      required: false,
      defaultValue: [],
    }),
    subject: Property.ShortText({
      displayName: 'Subject line',
      description: 'Enter a subject line for the transaction.',
      required: true,
    }),
    replyToEmail: Property.ShortText({
      displayName: 'Reply to email',
      description: 'Enter the email that the replies should go to.',
      required: true,
    }),
    replyToName: Property.ShortText({
      displayName: 'Reply to name',
      description: 'Enter a friendly name the replies should go to.',
      required: false,
    }),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'NOTE: Variable names (first column) keep only letters and numbers; any other characters are removed.',
      required: false,
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
      description: 'Select if the suppression filters on your account should be ignored for this transaction. Leave as "Do not ignore" unless you are sure the recipient wants this email.',
      required: false,
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
    return sendTransaction({ auth: context.auth.props, p: context.propsValue, ignoreSuppressCheck: String(context.propsValue.ignoreSuppressCheck) === 'true' });
  },
});

export const createTransactionAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_create_transaction_ai',
  classification: 'WRITE',
  displayName: 'Send A Transactional Email (AI)',
  description: 'Sends a transactional email that always respects your suppression filters. Uses Tarvent email API credits (a paid add-on).',
  audience: 'ai',
  aiMetadata: {
    description: 'Sends one transactional email through Tarvent to one TO recipient (with optional CC/BCC), using either an existing template ID or inline HTML/plain-text content with merge variables. Use for individual triggered messages such as receipts or confirmations, never for bulk marketing. Requires the paid Transactional Email API add-on and uses credits. Always respects the account suppression filters. Fails if Tarvent rejects the TO recipient; CC/BCC rejections are reported per recipient in the output. Not idempotent: every call sends another email.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.transactionSent,
  props: agentProps(),
  async run(context) {
    return sendTransaction({ auth: context.auth.props, p: context.propsValue, ignoreSuppressCheck: false });
  },
});


function agentProps() {
  const { ignoreSuppressCheck: _ignoreSuppressCheck, groupName: _groupName, templateId: _templateId, ...rest } = createTransaction.props;
  return {
    ...rest,
    groupName: Property.ShortText({ displayName: 'Transaction group name', description: 'Optional reporting group name.', required: false }),
    templateId: Property.ShortText({ displayName: 'Template ID', description: 'Tarvent template ID. Leave empty to send Content instead.', required: false }),
  };
}

async function sendTransaction({ auth, p, ignoreSuppressCheck }: { auth: TarventCredentials; p: TransactionInput; ignoreSuppressCheck: boolean }) {
    const fromEmail = tarventCommon.requireText({ value: p.fromEmail, label: 'From email' });
    const toEmail = tarventCommon.requireText({ value: p.toEmail, label: 'To email' });
    const subject = tarventCommon.requireText({ value: p.subject, label: 'Subject line' });
    const replyToEmail = tarventCommon.requireText({ value: p.replyToEmail, label: 'Reply to email' });
    const groupName = tarventCommon.trimmed(p.groupName);
    const fromName = tarventCommon.trimmed(p.fromName);
    const replyToName = tarventCommon.trimmed(p.replyToName);
    const templateId = tarventCommon.trimmed(p.templateId);
    const content = typeof p.content === 'string' && p.content.trim().length > 0 ? p.content : undefined;
    tarventCommon.checkLength({ value: groupName, label: 'Group name', max: 100 });
    tarventCommon.checkLength({ value: fromEmail, label: 'From email', max: 320 });
    tarventCommon.checkLength({ value: fromName, label: 'From name', max: 255 });
    tarventCommon.checkLength({ value: subject, label: 'Subject line', max: 500 });
    tarventCommon.checkLength({ value: replyToEmail, label: 'Reply to email', max: 320 });
    tarventCommon.checkLength({ value: replyToName, label: 'Reply to name', max: 255 });
    if (!templateId && !content) {
      throw new Error('Choose a Template or enter Content.');
    }
    if (!templateId && p.mimeType !== 'HTML' && p.mimeType !== 'TEXT') {
      throw new Error('Choose a Message type (HTML or Plain text) when sending Content without a template.');
    }
    const variables = Object.entries(p.variables ?? {}).flatMap(([name, value]) => {
      const clean = name.replace(/[^A-Za-z0-9]/g, '');
      return clean.length > 0 ? [{ name: clean, value }] : [];
    });
    const recipients = [
      { emailAddress: toEmail, type: 'TO', variables },
      ...emailList(p.ccEmail).map((emailAddress) => ({ emailAddress, type: 'CC', variables })),
      ...emailList(p.bccEmail).map((emailAddress) => ({ emailAddress, type: 'BCC', variables })),
    ];
    const results = await tarventTransport.field<TransactionResult[]>({
      auth,
      query: 'mutation CreateTransaction($input: CreateTransactionInput!) { createTransaction(input: $input) { emailAddress errorCode errorMsg requestId transactionId } }',
      variables: {
        input: {
          content: {
            templateId: templateId ?? null,
            contentBodies: templateId ? null : [{ bodyContent: (content ?? '').replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'), mimeType: p.mimeType }],
          },
          groupName,
          header: {
            from: { emailAddress: fromEmail, name: fromName ?? '' },
            replyTo: { emailAddress: replyToEmail, name: replyToName ?? '' },
            subject,
          },
          recipients,
          settings: { ignoreSuppressCheck: ignoreSuppressCheck },
        },
      },
      name: 'createTransaction',
    });
    const toResult = results.find((r) => (r.emailAddress ?? '').toLowerCase() === toEmail.toLowerCase()) ?? results[0];
    if (!toResult || toResult.errorCode || toResult.errorMsg) {
      throw new TarventApiError(
        `Tarvent did not send the email to ${toEmail}: ${toResult?.errorMsg ?? 'no result returned'}${toResult?.errorCode ? ` (code ${toResult.errorCode})` : ''}`,
        toResult?.errorCode ? String(toResult.errorCode) : undefined,
        200,
        results,
      );
    }
    return {
      requestId: toResult.requestId ?? null,
      transactionId: toResult.transactionId ?? null,
      recipients: results.map((r) => ({
        emailAddress: r.emailAddress ?? null,
        transactionId: r.transactionId ?? null,
        errorCode: r.errorCode ?? null,
        errorMsg: r.errorMsg ?? null,
        sent: !r.errorCode && !r.errorMsg,
      })),
    };
}

function emailList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row: unknown) => {
    const email = typeof row === 'object' && row !== null ? tarventCommon.trimmed(Reflect.get(row, 'email')) : undefined;
    return email ? [email] : [];
  });
}

type TransactionResult = {
  emailAddress?: string | null;
  errorCode?: string | number | null;
  errorMsg?: string | null;
  requestId?: string | null;
  transactionId?: string | null;
};

type TransactionInput = {
  groupName?: unknown;
  fromEmail?: unknown;
  fromName?: unknown;
  toEmail?: unknown;
  ccEmail?: unknown;
  bccEmail?: unknown;
  subject?: unknown;
  replyToEmail?: unknown;
  replyToName?: unknown;
  variables?: Record<string, unknown>;
  templateId?: unknown;
  mimeType?: unknown;
  content?: unknown;
};
