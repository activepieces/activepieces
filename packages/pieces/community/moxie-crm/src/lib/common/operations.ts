import { HttpMethod } from '@activepieces/pieces-common';
import { moxieRequest } from './client';
import { PAYMENT_TYPE_OPTIONS, moxieFields } from './fields';
import { isRecord } from '.';
import { MoxieCredentials, MoxieInvoiceMini } from './models';
import { moxieBody, moxieInput } from './props';

export const moxieOperations = {
  createClient({ credentials, values }: OperationParams): Promise<unknown> {
    const body = moxieBody.fromSpecs({ specs: moxieFields.clientCreate, values });
    return post({ credentials, path: '/action/clients/create', body });
  },

  updateClient({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['clientId'], field: 'Client ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.clientUpdate,
      body: moxieBody.fromSpecs({ specs: moxieFields.clientUpdate, values }),
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'client' });
    return patch({
      credentials,
      path: '/action/clients/update',
      body: { id, ...fields },
      notFoundMessage: `No client with id ${id} in this Moxie workspace.`,
    });
  },

  createContact({ credentials, values }: OperationParams): Promise<unknown> {
    const body = {
      ...moxieBody.fromSpecs({ specs: moxieFields.contactCreate, values }),
      ...moxieInput.compact({ values: { clientName: moxieInput.text({ value: values['clientName'] }) } }),
    };
    return post({
      credentials,
      path: '/action/contacts/create',
      body,
      notFoundMessage: 'Moxie could not find the client. Client Name must match an existing client exactly.',
    });
  },

  updateContact({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['contactId'], field: 'Contact ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.contactUpdate,
      body: {
        ...moxieBody.fromSpecs({ specs: moxieFields.contactUpdate, values }),
        ...moxieInput.compact({
          values: { clientId: moxieInput.optionalId({ value: values['clientId'], field: 'Client ID' }) },
        }),
      },
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'contact' });
    return patch({
      credentials,
      path: '/action/contacts/update',
      body: { id, ...fields },
      notFoundMessage: `No contact with id ${id} in this Moxie workspace.`,
    });
  },

  createProject({ credentials, values }: OperationParams): Promise<unknown> {
    const name = moxieInput.requiredText({ value: values['name'], field: 'Project Name' });
    const clientName = moxieInput.requiredText({ value: values['clientName'], field: 'Client Name' });
    const fee = moxieBody.fromSpecs({ specs: moxieFields.projectFee, values });
    if (fee['feeType'] === undefined && Object.keys(fee).length > 0) {
      throw new Error('Set Fee Type to send a fee amount, estimate or taxable flag.');
    }
    const body = {
      name,
      clientName,
      ...moxieBody.fromSpecs({ specs: moxieFields.projectCreate, values }),
      ...(fee['feeType'] === undefined ? {} : { feeSchedule: fee }),
    };
    return post({
      credentials,
      path: '/action/projects/create',
      body,
      notFoundMessage: `Moxie could not find the client "${clientName}" or the project template. Names must match exactly.`,
    });
  },

  updateProject({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['projectId'], field: 'Project ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.projectUpdate,
      body: moxieBody.fromSpecs({ specs: moxieFields.projectUpdate, values }),
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'project' });
    return patch({
      credentials,
      path: '/action/projects/update',
      body: { id, ...fields },
      notFoundMessage: `No project with id ${id} in this Moxie workspace.`,
    });
  },

  createTask({ credentials, values }: OperationParams): Promise<unknown> {
    const body = {
      name: moxieInput.requiredText({ value: values['name'], field: 'Task Name' }),
      clientName: moxieInput.requiredText({ value: values['clientName'], field: 'Client Name' }),
      projectName: moxieInput.requiredText({ value: values['projectName'], field: 'Project Name' }),
      ...moxieInput.compact({ values: { status: moxieInput.text({ value: values['status'] }) } }),
      ...moxieBody.fromSpecs({ specs: moxieFields.taskCreate, values }),
    };
    return post({
      credentials,
      path: '/action/tasks/create',
      body,
      notFoundMessage: 'Moxie could not find the client or project. Client Name and Project Name must match exactly.',
    });
  },

  updateTask({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['taskId'], field: 'Task ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.taskUpdate,
      body: {
        ...moxieBody.fromSpecs({ specs: moxieFields.taskUpdate, values }),
        ...moxieInput.compact({
          values: {
            statusId: moxieInput.optionalId({ value: values['statusId'], field: 'Stage ID' }),
            assignedToList: moxieInput.integerList({ value: values['assignedToList'], field: 'Assignee User IDs' }),
          },
        }),
      },
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'task' });
    return patch({
      credentials,
      path: '/action/tasks/update',
      body: { id, ...fields },
      notFoundMessage: `No task with id ${id} in this Moxie workspace.`,
    });
  },

  createOpportunity({ credentials, values }: OperationParams): Promise<unknown> {
    const body = {
      name: moxieInput.requiredText({ value: values['name'], field: 'Opportunity Name' }),
      ...moxieInput.compact({
        values: {
          clientName: moxieInput.text({ value: values['clientName'] }),
          stageName: moxieInput.text({ value: values['stageName'] }),
        },
      }),
      ...moxieBody.fromSpecs({ specs: moxieFields.opportunityCreate, values }),
    };
    return post({
      credentials,
      path: '/action/opportunities/create',
      body,
      notFoundMessage: 'Moxie could not find the client or pipeline stage. Names must match exactly.',
    });
  },

  updateOpportunity({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['opportunityId'], field: 'Opportunity ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.opportunityUpdate,
      body: {
        ...moxieBody.fromSpecs({ specs: moxieFields.opportunityUpdate, values }),
        ...moxieInput.compact({
          values: {
            statusId: moxieInput.optionalId({ value: values['statusId'], field: 'Stage ID' }),
            clientId: moxieInput.optionalId({ value: values['clientId'], field: 'Client ID' }),
          },
        }),
      },
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'opportunity' });
    return patch({
      credentials,
      path: '/action/opportunities/update',
      body: { id, ...fields },
      notFoundMessage: `No opportunity with id ${id} in this Moxie workspace.`,
    });
  },

  createInvoice({ credentials, values }: OperationParams): Promise<unknown> {
    const clientName = moxieInput.requiredText({ value: values['clientName'], field: 'Client Name' });
    const items = parseLineItems({ value: values['items'] });
    const send = moxieInput.triState({ value: values['send'], field: 'Send Invoice' }) === true;
    const contacts = moxieInput.stringList({ value: values['sendToContacts'], field: 'Send To Contacts' });
    const emailTemplateName = moxieInput.text({ value: values['emailTemplateName'] });
    if (!send && (contacts !== undefined || emailTemplateName !== undefined)) {
      throw new Error('Send To Contacts and Email Template only apply when Send Invoice is on.');
    }
    contacts?.forEach((email) => moxieInput.email({ value: email, field: 'Send To Contacts' }));
    const body = {
      clientName,
      items,
      ...moxieInput.compact({ values: { templateName: moxieInput.text({ value: values['templateName'] }) } }),
      ...moxieBody.fromSpecs({ specs: moxieFields.invoice, values }),
      ...(send ? { sendTo: moxieInput.compact({ values: { send: true, contacts, emailTemplateName } }) } : {}),
    };
    return post({
      credentials,
      path: '/action/invoices/create',
      body,
      notFoundMessage: `Moxie could not find the client "${clientName}", the email template or a send-to contact. Names must match exactly.`,
    });
  },

  async applyPayment({ credentials, values }: OperationParams): Promise<unknown> {
    const invoiceNumber = moxieInput.requiredText({ value: values['invoiceNumber'], field: 'Invoice Number' });
    const clientName = moxieInput.requiredText({ value: values['clientName'], field: 'Client Name' });
    const amount = moxieInput.number({ value: values['amount'], field: 'Amount', min: 0 });
    if (amount === undefined || amount === 0) {
      throw new Error('Amount must be more than 0.');
    }
    const referenceNumber = moxieInput.text({ value: values['referenceNumber'] });
    if (referenceNumber !== undefined) {
      const existing = await findAppliedPayment({ credentials, clientName, invoiceNumber, referenceNumber });
      if (existing !== undefined) {
        return { ...existing, already_applied: true };
      }
    }
    const body = moxieInput.compact({
      values: {
        invoiceNumber,
        clientName,
        amount,
        date: moxieInput.date({ value: values['date'], field: 'Payment Date' }),
        paymentType: parsePaymentType({ value: values['paymentType'] }),
        referenceNumber,
        memo: moxieInput.text({ value: values['memo'] }),
      },
    });
    const result = await post({
      credentials,
      path: '/action/payment/create',
      body,
      notFoundMessage: `Moxie could not find an open invoice ${invoiceNumber} for client "${clientName}". The invoice must be sent and not fully paid, and both values must match exactly.`,
    });
    return isRecord(result) ? { ...result, already_applied: false } : { result, already_applied: false };
  },

  createTimeEntry({ credentials, values }: OperationParams): Promise<unknown> {
    const timerStart = moxieInput.dateTime({ value: values['timerStart'], field: 'Start Time' });
    const timerEnd = moxieInput.dateTime({ value: values['timerEnd'], field: 'End Time' });
    if (timerStart === undefined || timerEnd === undefined) {
      throw new Error('Start Time and End Time are required.');
    }
    if (Date.parse(timerEnd) <= Date.parse(timerStart)) {
      throw new Error('End Time must be after Start Time.');
    }
    const body = moxieInput.compact({
      values: {
        timerStart,
        timerEnd,
        clientName: moxieInput.text({ value: values['clientName'] }),
        projectName: moxieInput.text({ value: values['projectName'] }),
        deliverableName: moxieInput.text({ value: values['deliverableName'] }),
        notes: moxieInput.text({ value: values['notes'] }),
        userEmail: moxieInput.email({ value: values['userEmail'], field: 'User Email' }),
        createClient: moxieInput.triState({ value: values['createClient'], field: 'Create Client if Missing' }) === true ? true : undefined,
        createProject: moxieInput.triState({ value: values['createProject'], field: 'Create Project if Missing' }) === true ? true : undefined,
        createDeliverable: moxieInput.triState({ value: values['createDeliverable'], field: 'Create Task if Missing' }) === true ? true : undefined,
      },
    });
    return post({
      credentials,
      path: '/action/timeWorked/create',
      body,
      notFoundMessage:
        'Moxie could not find the client, project, task or user. Names must match exactly, or turn on the matching Create option.',
    });
  },

  createExpense({ credentials, values }: OperationParams): Promise<unknown> {
    const amount = moxieInput.number({ value: values['amount'], field: 'Amount', min: 0 });
    if (amount === undefined) {
      throw new Error('Amount is required.');
    }
    const body = {
      amount,
      markupPercentage: 0,
      ...moxieInput.compact({
        values: {
          vendor: moxieInput.text({ value: values['vendor'] }),
          clientName: moxieInput.text({ value: values['clientName'] }),
        },
      }),
      ...moxieBody.fromSpecs({ specs: moxieFields.expenseCreate, values }),
    };
    return post({
      credentials,
      path: '/action/expenses/create',
      body,
      notFoundMessage: 'Moxie could not find the client. Client Name must match an existing client exactly.',
    });
  },

  updateExpense({ credentials, values }: OperationParams): Promise<unknown> {
    const id = moxieInput.id({ value: values['expenseId'], field: 'Expense ID' });
    const fields = moxieBody.withClears({
      specs: moxieFields.expenseUpdate,
      body: moxieBody.fromSpecs({ specs: moxieFields.expenseUpdate, values }),
      clearFields: values['clearFields'],
    });
    moxieBody.requireChanges({ body: fields, objectName: 'expense' });
    return patch({
      credentials,
      path: '/action/expenses/update',
      body: { id, ...fields },
      notFoundMessage: `No expense with id ${id} in this Moxie workspace.`,
    });
  },
};

function post({ credentials, path, body, notFoundMessage }: WriteParams): Promise<unknown> {
  return moxieRequest<unknown>({ credentials, method: HttpMethod.POST, path, body, notFoundMessage });
}

function patch({ credentials, path, body, notFoundMessage }: WriteParams): Promise<unknown> {
  return moxieRequest<unknown>({ credentials, method: HttpMethod.PATCH, path, body, notFoundMessage });
}

function parseLineItems({ value }: { value: unknown }): Record<string, unknown>[] {
  const rows = moxieInput.recordList({ value, field: 'Line Items' });
  if (rows === undefined) {
    throw new Error('Add at least one line item.');
  }
  return rows.map((row, index) => {
    const label = `Line item ${index + 1}`;
    const quantity = moxieInput.number({ value: row['quantity'], field: `${label} quantity`, min: 0 });
    const rate = moxieInput.number({ value: row['rate'], field: `${label} rate`, min: 0 });
    if (quantity === undefined || rate === undefined) {
      throw new Error(`${label} needs a quantity and a rate.`);
    }
    return moxieInput.compact({
      values: {
        description: moxieInput.requiredText({ value: row['description'], field: `${label} description` }),
        quantity,
        rate,
        taxable: moxieInput.triState({ value: row['taxable'], field: `${label} taxable` }),
        projectName: moxieInput.text({ value: row['projectName'] }),
      },
    });
  });
}

function parsePaymentType({ value }: { value: unknown }): string | undefined {
  const text = moxieInput.text({ value });
  if (text === undefined) {
    return undefined;
  }
  const match = PAYMENT_TYPE_OPTIONS.find((option) => option === text.toUpperCase());
  if (match === undefined) {
    throw new Error(`Payment Type must be one of: ${PAYMENT_TYPE_OPTIONS.join(', ')}. Got "${text}".`);
  }
  return match;
}

async function findAppliedPayment({
  credentials,
  clientName,
  invoiceNumber,
  referenceNumber,
}: {
  credentials: MoxieCredentials;
  clientName: string;
  invoiceNumber: string;
  referenceNumber: string;
}): Promise<MoxieInvoiceMini | undefined> {
  const invoices = await moxieRequest<unknown>({
    credentials,
    method: HttpMethod.GET,
    path: '/action/payableInvoices/search',
    query: { query: clientName },
  });
  if (!Array.isArray(invoices)) {
    return undefined;
  }
  const invoice = invoices.filter(isInvoiceMini).find(
    (candidate) => candidate.invoiceNumberFormatted?.toLowerCase() === invoiceNumber.toLowerCase(),
  );
  const alreadyApplied = invoice?.payments?.some((payment) => payment.referenceNumber === referenceNumber) === true;
  return alreadyApplied ? invoice : undefined;
}

function isInvoiceMini(value: unknown): value is MoxieInvoiceMini {
  if (!isRecord(value)) {
    return false;
  }
  const payments = value['payments'];
  return (
    (value['invoiceNumberFormatted'] === undefined || typeof value['invoiceNumberFormatted'] === 'string') &&
    (payments === undefined || payments === null || (Array.isArray(payments) && payments.every(isRecord)))
  );
}

type OperationParams = {
  credentials: MoxieCredentials;
  values: Record<string, unknown>;
};

type WriteParams = {
  credentials: MoxieCredentials;
  path: string;
  body: unknown;
  notFoundMessage?: string;
};
