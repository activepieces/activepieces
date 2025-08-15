import { createAction, Property } from '@activepieces/pieces-framework';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { amazonSesAuth } from '../../index';

export const sendTemplatedEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_templated_email',
  displayName: 'Send Templated Email',
  description: 'Send an email replacing the template tags with values using Amazon SES.',
  props: {
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'The email address to use as the "From" address for the email. The address must be verified in SES.',
      required: true,
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'Email addresses to send the message to',
      required: true,
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'Email addresses to carbon copy',
      required: false,
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'Email addresses to blind carbon copy',
      required: false,
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the email template to use',
      required: true,
    }),
    templateData: Property.Json({
      displayName: 'Template Data',
      description: 'JSON object containing the template variables and their values (e.g., {"name": "John", "company": "Acme Corp"})',
      required: true,
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply-To Addresses',
      description: 'Email addresses for replies',
      required: false,
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description: 'The name of the configuration set to use when sending the email',
      required: false,
    }),
    emailTags: Property.Array({
      displayName: 'Email Tags',
      description: 'Tags to apply to the email in the format "key=value"',
      required: false,
    }),
    feedbackForwardingEmailAddress: Property.ShortText({
      displayName: 'Feedback Forwarding Email Address',
      description: 'The address that you want bounce and complaint notifications to be sent to',
      required: false,
    }),
  },
  async run(context) {
    const {
      fromEmailAddress,
      toAddresses,
      ccAddresses,
      bccAddresses,
      templateName,
      templateData,
      replyToAddresses,
      configurationSetName,
      emailTags,
      feedbackForwardingEmailAddress,
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Create SES client
    const sesClient = new SESv2Client({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    });

    // Prepare destination
    const destination: any = {
      ToAddresses: Array.isArray(toAddresses) ? toAddresses : [toAddresses],
    };

    if (ccAddresses && ccAddresses.length > 0) {
      destination.CcAddresses = Array.isArray(ccAddresses) ? ccAddresses : [ccAddresses];
    }

    if (bccAddresses && bccAddresses.length > 0) {
      destination.BccAddresses = Array.isArray(bccAddresses) ? bccAddresses : [bccAddresses];
    }

    // Prepare template data as JSON string
    let templateDataString: string;
    try {
      if (typeof templateData === 'string') {
        // Validate that it's valid JSON
        JSON.parse(templateData);
        templateDataString = templateData;
      } else {
        templateDataString = JSON.stringify(templateData);
      }
    } catch (error) {
      throw new Error('Template data must be valid JSON format');
    }

    // Prepare email content using template
    const emailContent = {
      Template: {
        TemplateName: templateName,
        TemplateData: templateDataString,
      },
    };

    // Prepare email tags
    let messageTags: any[] | undefined;
    if (emailTags && emailTags.length > 0) {
      messageTags = emailTags.map((tag: string) => {
        const [name, value] = tag.split('=');
        return { Name: name?.trim(), Value: value?.trim() || '' };
      });
    }

    // Prepare send email command input
    const sendEmailInput: any = {
      FromEmailAddress: fromEmailAddress,
      Destination: destination,
      Content: emailContent,
    };

    // Add optional parameters
    if (replyToAddresses && replyToAddresses.length > 0) {
      sendEmailInput.ReplyToAddresses = Array.isArray(replyToAddresses) ? replyToAddresses : [replyToAddresses];
    }

    if (configurationSetName) {
      sendEmailInput.ConfigurationSetName = configurationSetName;
    }

    if (messageTags && messageTags.length > 0) {
      sendEmailInput.EmailTags = messageTags;
    }

    if (feedbackForwardingEmailAddress) {
      sendEmailInput.FeedbackForwardingEmailAddress = feedbackForwardingEmailAddress;
    }

    try {
      // Send the templated email
      const command = new SendEmailCommand(sendEmailInput);
      const response = await sesClient.send(command);

      return {
        success: true,
        messageId: response.MessageId,
        templateName: templateName,
        templateData: JSON.parse(templateDataString),
        message: 'Templated email sent successfully',
      };
    } catch (error) {
      const errorMessage = (error as Error).message;
      
      // Handle specific SES errors
      if (errorMessage.includes('NotFoundException')) {
        throw new Error(`Template "${templateName}" not found. Please ensure the template exists.`);
      } else if (errorMessage.includes('MessageRejected')) {
        throw new Error(`Email was rejected: ${errorMessage}`);
      } else if (errorMessage.includes('MailFromDomainNotVerifiedException')) {
        throw new Error(`The sending domain is not verified: ${errorMessage}`);
      } else if (errorMessage.includes('BadRequestException')) {
        throw new Error(`Invalid request data: ${errorMessage}`);
      }
      
      throw new Error(`Failed to send templated email: ${errorMessage}`);
    }
  },
});
