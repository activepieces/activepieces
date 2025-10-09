import {
  SESClient,
  ListIdentitiesCommand,
  ListConfigurationSetsCommand,
  GetIdentityVerificationAttributesCommand,
  ListTemplatesCommand,
  GetTemplateCommand,
  ListCustomVerificationEmailTemplatesCommand,
  GetCustomVerificationEmailTemplateCommand,
} from '@aws-sdk/client-ses';

export interface SESAuth {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * Creates a configured SES client
 */
export function createSESClient(auth: SESAuth): SESClient {
  return new SESClient({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
  });
}

/**
 * Fetches and filters verified identities from AWS SES
 */
export async function getVerifiedIdentities(auth: SESAuth): Promise<string[]> {
  const sesClient = createSESClient(auth);

  try {
    // Get all identities
    const identitiesResponse = await sesClient.send(
      new ListIdentitiesCommand({})
    );
    const identities = identitiesResponse.Identities || [];

    if (identities.length === 0) {
      return [];
    }

    // Check verification status for all identities
    const verificationResponse = await sesClient.send(
      new GetIdentityVerificationAttributesCommand({
        Identities: identities,
      })
    );

    // Filter to only verified identities
    const verifiedIdentities = identities.filter(
      (identity) =>
        verificationResponse.VerificationAttributes?.[identity]
          ?.VerificationStatus === 'Success'
    );

    return verifiedIdentities;
  } catch (error) {
    console.warn('Failed to fetch verified identities:', error);
    return [];
  }
}

/**
 * Fetches configuration sets from AWS SES
 */
export async function getConfigurationSets(auth: SESAuth): Promise<string[]> {
  const sesClient = createSESClient(auth);

  try {
    const response = await sesClient.send(new ListConfigurationSetsCommand({}));
    return (
      response.ConfigurationSets?.map((cs) => cs.Name).filter(
        (name): name is string => !!name
      ) || []
    );
  } catch (error) {
    console.warn('Failed to fetch configuration sets:', error);
    return [];
  }
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Converts HTML content to plain text
 * Strips HTML tags and converts common elements to text equivalents
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .trim();
}

/**
 * Validates and sanitizes email addresses from arrays
 */
export function validateEmailAddresses(
  emails: string[] | string | undefined,
  fieldName: string
): string[] {
  if (!emails) return [];

  const emailArray = Array.isArray(emails) ? emails : [emails];
  const validEmails: string[] = [];
  const invalidEmails: string[] = [];

  emailArray.forEach((email) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      if (isValidEmail(trimmedEmail)) {
        validEmails.push(trimmedEmail);
      } else {
        invalidEmails.push(trimmedEmail);
      }
    }
  });

  if (invalidEmails.length > 0) {
    throw new Error(
      `Invalid email addresses in ${fieldName}: ${invalidEmails.join(', ')}`
    );
  }

  return validEmails;
}

/**
 * Checks AWS SES recipient limits
 */
export function validateRecipientLimits(
  toAddresses: string[],
  ccAddresses: string[] = [],
  bccAddresses: string[] = []
): void {
  const totalRecipients =
    toAddresses.length + ccAddresses.length + bccAddresses.length;

  if (totalRecipients === 0) {
    throw new Error('At least one recipient is required (To, CC, or BCC)');
  }

  if (totalRecipients > 50) {
    throw new Error(
      `Too many recipients (${totalRecipients}). AWS SES allows maximum 50 recipients per email.`
    );
  }
}

/**
 * Converts email tags object to AWS SES MessageTag format
 */
export function formatEmailTags(
  tags: Record<string, string> | undefined
): Array<{ Name: string; Value: string }> | undefined {
  if (!tags || Object.keys(tags).length === 0) {
    return undefined;
  }

  return Object.entries(tags).map(([key, value]) => ({
    Name: key.trim(),
    Value: String(value).trim(),
  }));
}

/**
 * Gets user-friendly error message for AWS SES errors
 */
export function getSESErrorMessage(
  error: any,
  configurationSetName?: string
): string {
  switch (error.name) {
    case 'MessageRejected':
      return `Email rejected: ${error.message}`;
    case 'AccountSendingPausedException':
      return 'Email sending is disabled for your AWS account. Contact AWS support to enable it.';
    case 'ConfigurationSetDoesNotExistException':
      return `Configuration set "${configurationSetName}" does not exist.`;
    case 'ConfigurationSetSendingPausedException':
      return `Email sending is disabled for configuration set "${configurationSetName}".`;
    case 'MailFromDomainNotVerifiedException':
      return 'The custom MAIL FROM domain is not verified. Please verify it in the AWS SES console.';
    case 'InvalidParameterValue':
      return `Invalid parameter: ${error.message}`;
    case 'ThrottlingException':
      return 'Request was throttled. Please retry after a moment.';
    default:
      return `Failed to send email: ${
        error.message || 'Unknown error occurred'
      }`;
  }
}

/**
 * Dropdown option type for Activepieces
 */
export interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Creates dropdown options from verified identities
 */
export function createIdentityDropdownOptions(identities: string[]): {
  disabled: boolean;
  placeholder?: string;
  options: DropdownOption[];
} {
  if (identities.length === 0) {
    return {
      disabled: false,
      placeholder:
        'No verified identities found. Please verify an email address or domain in AWS SES console.',
      options: [],
    };
  }

  return {
    disabled: false,
    options: identities.map((identity) => ({
      label: identity,
      value: identity,
    })),
  };
}

/**
 * Creates dropdown options from configuration sets
 */
export function createConfigSetDropdownOptions(configSets: string[]): {
  disabled: boolean;
  options: DropdownOption[];
} {
  return {
    disabled: false,
    options: [
      { label: 'None', value: '' },
      ...configSets.map((name) => ({
        label: name,
        value: name,
      })),
    ],
  };
}

/**
 * Fetches existing email templates from AWS SES
 */
export async function getEmailTemplates(auth: SESAuth): Promise<string[]> {
  const sesClient = createSESClient(auth);

  try {
    const response = await sesClient.send(new ListTemplatesCommand({}));
    return (
      response.TemplatesMetadata?.map((template) => template.Name).filter(
        (name): name is string => !!name
      ) || []
    );
  } catch (error) {
    console.warn('Failed to fetch email templates:', error);
    return [];
  }
}

/**
 * Fetches a specific email template from AWS SES
 */
export async function getEmailTemplate(
  auth: SESAuth,
  templateName: string
): Promise<{
  templateName: string;
  subjectPart?: string;
  htmlPart?: string;
  textPart?: string;
} | null> {
  const sesClient = createSESClient(auth);

  try {
    const response = await sesClient.send(
      new GetTemplateCommand({
        TemplateName: templateName,
      })
    );

    if (response.Template) {
      return {
        templateName: response.Template.TemplateName || templateName,
        subjectPart: response.Template.SubjectPart,
        htmlPart: response.Template.HtmlPart,
        textPart: response.Template.TextPart,
      };
    }

    return null;
  } catch (error: any) {
    if (error.name === 'TemplateDoesNotExistException') {
      return null;
    }
    console.warn('Failed to fetch email template:', error);
    return null;
  }
}

/**
 * Validates template name format
 */
export function validateTemplateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('Template name is required');
  }

  // AWS SES template name requirements
  const trimmedName = name.trim();
  if (trimmedName.length > 64) {
    throw new Error('Template name must be 64 characters or less');
  }

  // Template name can only contain alphanumeric characters, underscores, and hyphens
  const validNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validNameRegex.test(trimmedName)) {
    throw new Error(
      'Template name can only contain letters, numbers, underscores, and hyphens'
    );
  }
}

/**
 * Validates template content
 */
export function validateTemplateContent(
  htmlPart?: string,
  textPart?: string
): void {
  if (!htmlPart && !textPart) {
    throw new Error('At least one of HTML or text content must be provided');
  }

  // Check content size limits (AWS SES limits)
  if (htmlPart && htmlPart.length > 500000) {
    throw new Error('HTML content must be 500KB or less');
  }

  if (textPart && textPart.length > 500000) {
    throw new Error('Text content must be 500KB or less');
  }
}

/**
 * Gets user-friendly error message for template-related AWS SES errors
 */
export function getTemplateErrorMessage(
  error: any,
  templateName?: string
): string {
  switch (error.name) {
    case 'AlreadyExistsException':
      return `Template "${templateName}" already exists. Please choose a different name.`;
    case 'InvalidTemplateException':
      return 'Template content is invalid. Please check your template syntax and variables.';
    case 'LimitExceededException':
      return 'You have reached the maximum number of email templates allowed for your account.';
    case 'TemplateDoesNotExistException':
      return `Template "${templateName}" does not exist.`;
    case 'ThrottlingException':
      return 'Request was throttled. Please retry after a moment.';
    default:
      return `Failed to process template: ${
        error.message || 'Unknown error occurred'
      }`;
  }
}

/**
 * Extracts and validates template variables from content
 */
export function extractTemplateVariables(content: string): string[] {
  const variableRegex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (variable && !variables.includes(variable)) {
      variables.push(variable);
    }
  }

  return variables;
}

/**
 * Validates template variable syntax
 */
export function validateTemplateVariables(
  subject: string,
  htmlPart?: string,
  textPart?: string
): string[] {
  const allVariables: string[] = [];

  // Extract variables from all content parts
  allVariables.push(...extractTemplateVariables(subject));
  if (htmlPart) {
    allVariables.push(...extractTemplateVariables(htmlPart));
  }
  if (textPart) {
    allVariables.push(...extractTemplateVariables(textPart));
  }

  // Remove duplicates
  const uniqueVariables = [...new Set(allVariables)];

  // Validate variable names
  const invalidVariables = uniqueVariables.filter((variable) => {
    // AWS SES template variables should not contain spaces or special characters except dots
    return !/^[a-zA-Z0-9_.]+$/.test(variable);
  });

  if (invalidVariables.length > 0) {
    throw new Error(
      `Invalid template variables: ${invalidVariables.join(
        ', '
      )}. Variables can only contain letters, numbers, underscores, and dots.`
    );
  }

  return uniqueVariables;
}

/**
 * Creates template preview with sample data
 */
export function createTemplatePreview(
  content: string,
  sampleData: Record<string, string> = {}
): string {
  let preview = content;

  // Replace template variables with sample data
  const variables = extractTemplateVariables(content);
  variables.forEach((variable) => {
    const value = sampleData[variable] || `[${variable}]`;
    const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
    preview = preview.replace(regex, value);
  });

  return preview;
}

/**
 * Compares two template versions and returns what changed
 */
export function compareTemplateContent(
  current: {
    subjectPart?: string;
    htmlPart?: string;
    textPart?: string;
  },
  updated: {
    subjectPart: string;
    htmlPart?: string;
    textPart?: string;
  }
): {
  subjectChanged: boolean;
  htmlChanged: boolean;
  textChanged: boolean;
  summary: string[];
} {
  const changes = {
    subjectChanged: current.subjectPart !== updated.subjectPart,
    htmlChanged: current.htmlPart !== updated.htmlPart,
    textChanged: current.textPart !== updated.textPart,
  };

  const summary: string[] = [];
  if (changes.subjectChanged) {
    summary.push('Subject updated');
  }
  if (changes.htmlChanged) {
    if (current.htmlPart && updated.htmlPart) {
      summary.push('HTML content modified');
    } else if (!current.htmlPart && updated.htmlPart) {
      summary.push('HTML content added');
    } else if (current.htmlPart && !updated.htmlPart) {
      summary.push('HTML content removed');
    }
  }
  if (changes.textChanged) {
    if (current.textPart && updated.textPart) {
      summary.push('Text content modified');
    } else if (!current.textPart && updated.textPart) {
      summary.push('Text content added');
    } else if (current.textPart && !updated.textPart) {
      summary.push('Text content removed');
    }
  }

  if (summary.length === 0) {
    summary.push('No changes detected');
  }

  return { ...changes, summary };
}

/**
 * Fetches existing custom verification email templates from AWS SES
 */
export async function getCustomVerificationTemplates(
  auth: SESAuth
): Promise<string[]> {
  const sesClient = createSESClient(auth);

  try {
    const response = await sesClient.send(
      new ListCustomVerificationEmailTemplatesCommand({})
    );
    return (
      response.CustomVerificationEmailTemplates?.map(
        (template) => template.TemplateName
      ).filter((name): name is string => !!name) || []
    );
  } catch (error) {
    console.warn('Failed to fetch custom verification templates:', error);
    return [];
  }
}

/**
 * Fetches a specific custom verification email template from AWS SES
 */
export async function getCustomVerificationTemplate(
  auth: SESAuth,
  templateName: string
): Promise<{
  templateName: string;
  fromEmailAddress?: string;
  templateSubject?: string;
  templateContent?: string;
  successRedirectionURL?: string;
  failureRedirectionURL?: string;
} | null> {
  const sesClient = createSESClient(auth);

  try {
    const response = await sesClient.send(
      new GetCustomVerificationEmailTemplateCommand({
        TemplateName: templateName,
      })
    );

    return {
      templateName: response.TemplateName || templateName,
      fromEmailAddress: response.FromEmailAddress,
      templateSubject: response.TemplateSubject,
      templateContent: response.TemplateContent,
      successRedirectionURL: response.SuccessRedirectionURL,
      failureRedirectionURL: response.FailureRedirectionURL,
    };
  } catch (error: any) {
    if (error.name === 'CustomVerificationEmailTemplateDoesNotExistException') {
      return null;
    }
    console.warn('Failed to fetch custom verification template:', error);
    return null;
  }
}

/**
 * Validates custom verification template name format
 */
export function validateCustomVerificationTemplateName(name: string): void {
  validateTemplateName(name); // Uses same rules as regular templates
}

/**
 * Validates URL format
 */
export function validateURL(url: string, fieldName: string): void {
  if (!url || url.trim().length === 0) {
    throw new Error(`${fieldName} is required`);
  }

  try {
    new URL(url.trim());
  } catch (error) {
    throw new Error(
      `${fieldName} must be a valid URL (e.g., https://example.com)`
    );
  }
}

/**
 * Validates custom verification template content
 */
export function validateCustomVerificationContent(content: string): void {
  if (!content || content.trim().length === 0) {
    throw new Error('Template content is required');
  }

  // Check content size limits (AWS SES limit is 10MB)
  const contentSizeBytes = new TextEncoder().encode(content).length;
  const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

  if (contentSizeBytes > maxSizeBytes) {
    throw new Error(
      `Template content size (${Math.round(
        contentSizeBytes / 1024 / 1024
      )}MB) exceeds the 10MB limit`
    );
  }
}

/**
 * Compares two custom verification template versions and returns what changed
 */
export function compareCustomVerificationContent(
  current: {
    fromEmailAddress?: string;
    templateSubject?: string;
    templateContent?: string;
    successRedirectionURL?: string;
    failureRedirectionURL?: string;
  },
  updated: {
    fromEmailAddress: string;
    templateSubject: string;
    templateContent: string;
    successRedirectionURL: string;
    failureRedirectionURL: string;
  }
): {
  fromEmailChanged: boolean;
  subjectChanged: boolean;
  contentChanged: boolean;
  successUrlChanged: boolean;
  failureUrlChanged: boolean;
  summary: string[];
} {
  const changes = {
    fromEmailChanged: current.fromEmailAddress !== updated.fromEmailAddress,
    subjectChanged: current.templateSubject !== updated.templateSubject,
    contentChanged: current.templateContent !== updated.templateContent,
    successUrlChanged:
      current.successRedirectionURL !== updated.successRedirectionURL,
    failureUrlChanged:
      current.failureRedirectionURL !== updated.failureRedirectionURL,
  };

  const summary: string[] = [];
  if (changes.fromEmailChanged) {
    summary.push('Sender email address updated');
  }
  if (changes.subjectChanged) {
    summary.push('Subject line updated');
  }
  if (changes.contentChanged) {
    summary.push('Template content modified');
  }
  if (changes.successUrlChanged) {
    summary.push('Success redirect URL updated');
  }
  if (changes.failureUrlChanged) {
    summary.push('Failure redirect URL updated');
  }

  if (summary.length === 0) {
    summary.push('No changes detected');
  }

  return { ...changes, summary };
}

/**
 * Gets user-friendly error message for custom verification template errors
 */
export function getCustomVerificationErrorMessage(
  error: any,
  templateName?: string
): string {
  switch (error.name) {
    case 'CustomVerificationEmailTemplateAlreadyExistsException':
      return `Custom verification template "${templateName}" already exists. Please choose a different name.`;
    case 'CustomVerificationEmailInvalidContentException':
      return 'Template content is invalid. Please check your HTML content and ensure it meets AWS SES requirements.';
    case 'FromEmailAddressNotVerifiedException':
      return 'The sender email address is not verified. Please verify the email address in AWS SES console first.';
    case 'LimitExceededException':
      return 'You have reached the maximum number of custom verification templates allowed for your account.';
    case 'ThrottlingException':
      return 'Request was throttled. Please retry after a moment.';
    default:
      return `Failed to process custom verification template: ${
        error.message || 'Unknown error occurred'
      }`;
  }
}

/**
 * Calculates and formats content size
 */
export function formatContentSize(content: string): {
  bytes: number;
  formatted: string;
} {
  const bytes = new TextEncoder().encode(content).length;

  if (bytes < 1024) {
    return { bytes, formatted: `${bytes} bytes` };
  } else if (bytes < 1024 * 1024) {
    return { bytes, formatted: `${Math.round(bytes / 1024)}KB` };
  } else {
    return {
      bytes,
      formatted: `${Math.round((bytes / 1024 / 1024) * 10) / 10}MB`,
    };
  }
}
