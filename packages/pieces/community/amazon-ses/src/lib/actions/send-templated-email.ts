import { createAction, Property } from '@activepieces/pieces-framework';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { amazonSesAuth } from '../../index';

export const sendTemplatedEmail = createAction({
  auth: amazonSesAuth,
  name: 'send_templated_email',
  displayName: 'Send Templated Email',
  description:
    'Send an email replacing the template tags with values using Amazon SES.',
  props: {
    fromEmailAddress: Property.ShortText({
      displayName: 'From Email Address',
      description:
        'The email address to use as the "From" address for the email. The address must be verified in SES.',
      required: true
    }),
    toAddresses: Property.Array({
      displayName: 'To Addresses',
      description: 'Email addresses to send the message to',
      required: true
    }),
    ccAddresses: Property.Array({
      displayName: 'CC Addresses',
      description: 'Email addresses to carbon copy',
      required: false
    }),
    bccAddresses: Property.Array({
      displayName: 'BCC Addresses',
      description: 'Email addresses to blind carbon copy',
      required: false
    }),
    templateName: Property.ShortText({
      displayName: 'Template Name',
      description: 'The name of the email template to use',
      required: true
    }),
    templateData: Property.Json({
      displayName: 'Template Data',
      description:
        'JSON object containing the template variables and their values (e.g., {"name": "John", "company": "Acme Corp"})',
      required: true
    }),
    replyToAddresses: Property.Array({
      displayName: 'Reply-To Addresses',
      description: 'Email addresses for replies',
      required: false
    }),
    configurationSetName: Property.ShortText({
      displayName: 'Configuration Set Name',
      description:
        'The name of the configuration set to use when sending the email',
      required: false
    }),
    emailTags: Property.Array({
      displayName: 'Email Tags',
      description: 'Tags to apply to the email in the format "key=value"',
      required: false
    })
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
      emailTags
    } = context.propsValue;

    const { accessKeyId, secretAccessKey, region } = context.auth;

    // Create SES client
    const sesClient = new SESClient({
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      region
    });

    // Prepare destination addresses
    const destination = {
      ToAddresses: Array.isArray(toAddresses)
        ? (toAddresses as string[])
        : [toAddresses as string],
      ...(ccAddresses && ccAddresses.length > 0
        ? {
            CcAddresses: Array.isArray(ccAddresses)
              ? (ccAddresses as string[])
              : [ccAddresses as string]
          }
        : {}),
      ...(bccAddresses && bccAddresses.length > 0
        ? {
            BccAddresses: Array.isArray(bccAddresses)
              ? (bccAddresses as string[])
              : [bccAddresses as string]
          }
        : {})
    };

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

    // Create send templated email command following AWS SDK example structure
    const sendTemplatedEmailCommand = new SendTemplatedEmailCommand({
      Destination: destination,
      TemplateData: templateDataString,
      Source: fromEmailAddress,
      Template: templateName,
      ...(replyToAddresses && replyToAddresses.length > 0
        ? {
            ReplyToAddresses: Array.isArray(replyToAddresses)
              ? (replyToAddresses as string[])
              : [replyToAddresses as string]
          }
        : {}),
      ...(configurationSetName
        ? {
            ConfigurationSetName: configurationSetName
          }
        : {}),
      ...(emailTags && emailTags.length > 0
        ? {
            Tags: (emailTags as string[]).map((tag: string) => {
              const [name, value] = tag.split('=');
              return { Name: name?.trim(), Value: value?.trim() || '' };
            })
          }
        : {})
    });

    try {
      const response = await sesClient.send(sendTemplatedEmailCommand);

      return {
        success: true,
        messageId: response.MessageId,
        templateName: templateName,
        templateData: JSON.parse(templateDataString),
        message: 'Templated email sent successfully'
      };
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'MessageRejected') {
        // Following the example pattern for MessageRejected errors
        return caught;
      }
      throw caught;
    }
  }
});
