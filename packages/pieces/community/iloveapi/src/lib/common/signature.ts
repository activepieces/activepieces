import { CreateSignatureRequest, SignatureElement, SignatureSigner } from './types';

const SIGNER_TYPES = ['signer', 'validator', 'viewer'] as const;
const FORCE_TYPES = ['all', 'text', 'sign', 'image'] as const;
const ELEMENT_TYPES = ['signature', 'initials', 'date', 'text', 'input'] as const;
const MAX_SIGNERS = 50;
const MAX_ELEMENTS = 1000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function signatureBodyOf({
  signers,
  elements,
  options,
}: {
  signers: unknown;
  elements: unknown;
  options: SignatureOptionsInput;
}): SignatureDraft {
  const signerRows = Array.isArray(signers) ? signers : [];
  if (signerRows.length === 0) {
    throw new Error('At least one signer is required.');
  }
  if (signerRows.length > MAX_SIGNERS) {
    throw new Error(`iLoveSign accepts at most ${MAX_SIGNERS} signers per request.`);
  }
  const parsedSigners = signerRows.map((row: unknown, index) => signerOf({ row, index }));
  const emails = parsedSigners.map((signer) => signer.email.toLowerCase());
  const duplicate = emails.find((email, index) => emails.indexOf(email) !== index);
  if (duplicate) {
    throw new Error(`Signer email ${duplicate} is listed more than once.`);
  }

  const elementRows = Array.isArray(elements) ? elements : [];
  if (elementRows.length > MAX_ELEMENTS) {
    throw new Error(`iLoveSign accepts at most ${MAX_ELEMENTS} signature elements per request.`);
  }
  const parsedElements = elementRows.map((row: unknown, index) => elementOf({ row, index, emails }));

  const withElements = parsedSigners.map((signer) => {
    const own = parsedElements
      .filter((entry) => entry.email === signer.email.toLowerCase())
      .map((entry) => entry.element);
    return own.length > 0 ? { ...signer, elements: own } : signer;
  });

  return { signers: withElements, options: optionsOf(options) };
}

export function buildSignatureRequest({
  draft,
  task,
  files,
}: {
  draft: SignatureDraft;
  task: string;
  files: Array<{ server_filename: string; filename: string }>;
}): CreateSignatureRequest {
  return {
    ...draft.options,
    task,
    files,
    signers: draft.signers.map(({ elements, ...signer }) => ({
      ...signer,
      files: files.map((file) => ({
        server_filename: file.server_filename,
        ...(elements && elements.length > 0 ? { elements } : {}),
      })),
    })),
  };
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function pick<T extends string>({
  value,
  allowed,
  fallback,
  label,
}: {
  value: unknown;
  allowed: readonly T[];
  fallback: T;
  label: string;
}): T {
  const given = text(value);
  if (given === undefined) return fallback;
  const match = allowed.find((candidate) => candidate === given);
  if (!match) {
    throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  }
  return match;
}

function field({ row, key }: { row: unknown; key: string }): unknown {
  return row !== null && typeof row === 'object' ? Reflect.get(row, key) : undefined;
}

function signerOf({ row, index }: { row: unknown; index: number }): SignerDraft {
  const label = `Signer ${index + 1}`;
  const name = text(field({ row, key: 'name' }));
  const email = text(field({ row, key: 'email' }));
  if (!name || !email) {
    throw new Error(`${label} needs both a name and an email.`);
  }
  if (!EMAIL.test(email)) {
    throw new Error(`${label} has an invalid email: ${email}`);
  }
  const phone = text(field({ row, key: 'phone' }));
  const accessCode = text(field({ row, key: 'access_code' }));
  const notes = text(field({ row, key: 'notes' }));
  return {
    name,
    email,
    type: pick<(typeof SIGNER_TYPES)[number]>({ value: field({ row, key: 'type' }), allowed: SIGNER_TYPES, fallback: 'signer', label: `${label} role` }),
    force_signature_type: pick<(typeof FORCE_TYPES)[number]>({
      value: field({ row, key: 'force_signature_type' }),
      allowed: FORCE_TYPES,
      fallback: 'all',
      label: `${label} signature type`,
    }),
    ...(phone ? { phone } : {}),
    ...(accessCode ? { access_code: accessCode } : {}),
    ...(notes ? { notes } : {}),
  };
}

function elementOf({
  row,
  index,
  emails,
}: {
  row: unknown;
  index: number;
  emails: string[];
}): { email: string; element: SignatureElement } {
  const label = `Signature element ${index + 1}`;
  const email = text(field({ row, key: 'signer_email' }))?.toLowerCase();
  const position = text(field({ row, key: 'position' }));
  const pages = text(field({ row, key: 'pages' }));
  if (!email || !position || !pages) {
    throw new Error(`${label} needs a signer email, a position and pages.`);
  }
  if (!emails.includes(email)) {
    throw new Error(`${label} uses ${email}, which matches no signer.`);
  }
  const type = pick<(typeof ELEMENT_TYPES)[number]>({ value: field({ row, key: 'type' }), allowed: ELEMENT_TYPES, fallback: 'signature', label: `${label} type` });
  const sizeRaw = field({ row, key: 'size' });
  const size = sizeRaw === undefined || sizeRaw === null || sizeRaw === '' ? undefined : Number(sizeRaw);
  if (size !== undefined && !(Number.isFinite(size) && size > 0)) {
    throw new Error(`${label} size must be a positive number.`);
  }
  const content = text(field({ row, key: 'content' }));
  const color = text(field({ row, key: 'color' }));
  return {
    email,
    element: {
      type,
      position,
      pages,
      ...(size !== undefined ? { size } : {}),
      ...(content ? { content } : {}),
      ...(color ? { color } : {}),
    },
  };
}

function optionalNumber({
  value,
  label,
  min,
  max,
}: {
  value: unknown;
  label: string;
  min: number;
  max: number;
}): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${label} must be a whole number between ${min} and ${max}.`);
  }
  return parsed;
}

function optionsOf(options: SignatureOptionsInput): Partial<CreateSignatureRequest> {
  const expiration = optionalNumber({ value: options.expiration_days, label: 'Expiration (days)', min: 1, max: 130 });
  const cycle = optionalNumber({
    value: options.signer_reminder_days_cycle,
    label: 'Reminder Frequency (days)',
    min: 1,
    max: 130,
  });
  const brand = text(options.brand_name);
  const language = text(options.language);
  const subject = text(options.subject_signer);
  const message = text(options.message_signer);
  return {
    ...(brand ? { brand_name: brand } : {}),
    ...(language ? { language } : {}),
    ...(subject ? { subject_signer: subject } : {}),
    ...(message ? { message_signer: message } : {}),
    ...(expiration !== undefined ? { expiration_days: expiration } : {}),
    ...(typeof options.lock_order === 'boolean' ? { lock_order: options.lock_order } : {}),
    ...(typeof options.signer_reminders === 'boolean' ? { signer_reminders: options.signer_reminders } : {}),
    ...(cycle !== undefined ? { signer_reminder_days_cycle: cycle } : {}),
    ...(typeof options.certified === 'boolean' ? { certified: options.certified } : {}),
  };
}

type SignerDraft = Omit<SignatureSigner, 'files'> & { elements?: SignatureElement[] };

export type SignatureDraft = {
  signers: SignerDraft[];
  options: Partial<CreateSignatureRequest>;
};

export type SignatureOptionsInput = {
  brand_name?: unknown;
  language?: unknown;
  subject_signer?: unknown;
  message_signer?: unknown;
  expiration_days?: unknown;
  lock_order?: unknown;
  signer_reminders?: unknown;
  signer_reminder_days_cycle?: unknown;
  certified?: unknown;
};
