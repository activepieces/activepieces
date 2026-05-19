import { Property, createAction } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iLoveApi } from '../common/client';
import {
  CreateSignatureRequest,
  SignatureElement,
  SignatureSigner,
} from '../common/types';

type SignerRow = {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'signer' | 'validator' | 'viewer';
  force_signature_type?: 'all' | 'text' | 'sign' | 'image';
  access_code?: string;
};

type ElementRow = {
  signer_email?: string;
  type?: 'signature' | 'initials' | 'date' | 'text' | 'input';
  position?: string;
  pages?: string;
  size?: number;
  content?: string;
  color?: string;
};

export const createSignatureRequestAction = createAction({
  auth: iloveapiAuth,
  name: 'create_signature_request',
  displayName: 'Create Signature Request',
  description:
    'Send one or more PDF documents for electronic signature, with custom signers and signature placeholders.',
  props: {
    files: Property.Array({
      displayName: 'PDF Files',
      description: 'Documents to send for signature.',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'File',
          required: true,
        }),
      },
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description: 'People who will receive the document.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        phone: Property.ShortText({
          displayName: 'Phone (optional)',
          description:
            'International format including country code, e.g. +14155550100.',
          required: false,
        }),
        type: Property.StaticDropdown({
          displayName: 'Role',
          required: false,
          defaultValue: 'signer',
          options: {
            disabled: false,
            options: [
              { label: 'Signer (can sign)', value: 'signer' },
              { label: 'Validator (approves)', value: 'validator' },
              { label: 'Viewer (read only)', value: 'viewer' },
            ],
          },
        }),
        force_signature_type: Property.StaticDropdown({
          displayName: 'Force Signature Type',
          required: false,
          defaultValue: 'all',
          options: {
            disabled: false,
            options: [
              { label: 'All types allowed', value: 'all' },
              { label: 'Type only', value: 'text' },
              { label: 'Hand-drawn signature', value: 'sign' },
              { label: 'Upload image', value: 'image' },
            ],
          },
        }),
        access_code: Property.ShortText({
          displayName: 'Access Code (optional)',
          description:
            'Extra code the signer must enter before opening the document.',
          required: false,
        }),
      },
    }),
    elements: Property.Array({
      displayName: 'Signature Elements',
      description:
        'Placeholders to drop on each PDF page. Match them to signers by email. If empty, iLovePDF will let signers place fields freely.',
      required: false,
      properties: {
        signer_email: Property.ShortText({
          displayName: 'Signer Email',
          description: 'Email matching one of the signers above.',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Element Type',
          required: true,
          defaultValue: 'signature',
          options: {
            disabled: false,
            options: [
              { label: 'Signature', value: 'signature' },
              { label: 'Initials', value: 'initials' },
              { label: 'Date', value: 'date' },
              { label: 'Static Text', value: 'text' },
              { label: 'Input (text field)', value: 'input' },
            ],
          },
        }),
        position: Property.ShortText({
          displayName: 'Position',
          description:
            'Either a gravity keyword like "bottom right" or coordinates "X Y" (PDF origin is bottom-left; use negative Y to measure from top).',
          required: true,
          defaultValue: 'bottom right',
        }),
        pages: Property.ShortText({
          displayName: 'Pages',
          description: 'Pages to drop this element on, e.g. "1" or "1-3" or "all".',
          required: true,
          defaultValue: '1',
        }),
        size: Property.Number({
          displayName: 'Size',
          description: 'Font size or element height. Defaults to 14 for text, 50 for signature.',
          required: false,
        }),
        content: Property.ShortText({
          displayName: 'Content',
          description:
            'Static text (for type "text") or default value (for "input" / "date").',
          required: false,
        }),
        color: Property.ShortText({
          displayName: 'Color',
          description: 'Hex color for text elements, e.g. #000000.',
          required: false,
        }),
      },
    }),
    brand_name: Property.ShortText({
      displayName: 'Brand Name',
      description: 'Sender name shown in the email and signing page.',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      defaultValue: 'en-US',
      options: {
        disabled: false,
        options: [
          { label: 'English (US)', value: 'en-US' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Catalan', value: 'ca' },
          { label: 'Dutch', value: 'nl' },
        ],
      },
    }),
    subject_signer: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line for the signature invitation email.',
      required: false,
    }),
    message_signer: Property.LongText({
      displayName: 'Email Message',
      description: 'Body for the signature invitation email.',
      required: false,
    }),
    expiration_days: Property.Number({
      displayName: 'Expiration (days)',
      description: 'Days until the request expires. 1 to 130. Default 120.',
      required: false,
    }),
    lock_order: Property.Checkbox({
      displayName: 'Sign in Order',
      description:
        'When enabled, signers receive the document one at a time in the listed order.',
      required: false,
      defaultValue: false,
    }),
    signer_reminders: Property.Checkbox({
      displayName: 'Auto Reminders',
      description: 'Send reminder emails to signers who have not yet signed.',
      required: false,
      defaultValue: true,
    }),
    signer_reminder_days_cycle: Property.Number({
      displayName: 'Reminder Frequency (days)',
      description: 'Days between auto-reminders. Default 1.',
      required: false,
    }),
    certified: Property.Checkbox({
      displayName: 'Certified Signature',
      description: 'Apply a certified-signature seal to the final PDF.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      files,
      signers,
      elements,
      brand_name,
      language,
      subject_signer,
      message_signer,
      expiration_days,
      lock_order,
      signer_reminders,
      signer_reminder_days_cycle,
      certified,
    } = context.propsValue;

    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('At least one PDF file is required.');
    }
    if (!Array.isArray(signers) || signers.length === 0) {
      throw new Error('At least one signer is required.');
    }

    const token = await iLoveApi.authenticate({
      publicKey: context.auth.secret_text,
    });
    const startResp = await iLoveApi.startTask({ token, tool: 'sign' });

    const uploadedFiles: Array<{ server_filename: string; filename: string }> = [];
    for (const entry of files as Array<{
      file: { base64: string; filename: string };
    }>) {
      if (!entry.file?.base64) {
        throw new Error('Each PDF row must include a file.');
      }
      const buffer = Buffer.from(entry.file.base64, 'base64');
      const serverFilename = await iLoveApi.uploadBuffer({
        token,
        server: startResp.server,
        task: startResp.task,
        buffer,
        filename: entry.file.filename,
      });
      uploadedFiles.push({
        server_filename: serverFilename,
        filename: entry.file.filename,
      });
    }

    const signerRows = signers as SignerRow[];
    const elementRows = (elements ?? []) as ElementRow[];

    const elementsByEmail = new Map<string, SignatureElement[]>();
    for (const row of elementRows) {
      if (!row.signer_email || !row.type || !row.position || !row.pages) continue;
      const element: SignatureElement = {
        type: row.type,
        position: row.position,
        pages: row.pages,
        ...(row.size !== undefined && row.size !== null ? { size: row.size } : {}),
        ...(row.content ? { content: row.content } : {}),
        ...(row.color ? { color: row.color } : {}),
      };
      const list = elementsByEmail.get(row.signer_email) ?? [];
      list.push(element);
      elementsByEmail.set(row.signer_email, list);
    }

    const signatureSigners: SignatureSigner[] = signerRows.map((row) => {
      if (!row.name || !row.email) {
        throw new Error('Each signer needs both name and email.');
      }
      const elementsForSigner = elementsByEmail.get(row.email);
      const signerFiles = uploadedFiles.map((file) => ({
        server_filename: file.server_filename,
        ...(elementsForSigner && elementsForSigner.length > 0
          ? { elements: elementsForSigner }
          : {}),
      }));
      return {
        name: row.name,
        email: row.email,
        type: row.type ?? 'signer',
        force_signature_type: row.force_signature_type ?? 'all',
        files: signerFiles,
        ...(row.phone ? { phone: row.phone } : {}),
        ...(row.access_code ? { access_code: row.access_code } : {}),
      };
    });

    const body: CreateSignatureRequest = {
      task: startResp.task,
      files: uploadedFiles,
      signers: signatureSigners,
      ...(brand_name ? { brand_name } : {}),
      ...(language ? { language } : {}),
      ...(subject_signer ? { subject_signer } : {}),
      ...(message_signer ? { message_signer } : {}),
      ...(expiration_days !== undefined && expiration_days !== null
        ? { expiration_days }
        : {}),
      ...(lock_order !== undefined ? { lock_order } : {}),
      ...(signer_reminders !== undefined ? { signer_reminders } : {}),
      ...(signer_reminder_days_cycle !== undefined &&
      signer_reminder_days_cycle !== null
        ? { signer_reminder_days_cycle }
        : {}),
      ...(certified !== undefined ? { certified } : {}),
    };

    const response = await iLoveApi.createSignature({
      token,
      server: startResp.server,
      body,
    });

    return {
      ...response,
      server: startResp.server,
    };
  },
});
