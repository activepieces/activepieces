import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { smarterMeasureAuth } from '../..';

export const assessmentCompletedTrigger = createTrigger({
  auth: smarterMeasureAuth,
  name: 'assessment_completed',
  displayName: 'Assessment Completed',
  description: 'Triggers when a SmarterMeasure assessment is completed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    liveUrl: Property.MarkDown({
      value: "**Live URL:**\n```text\n{{webhookUrl}}\n```\nConfigure SmarterMeasure to send assessment completion events to this URL.\n",
      variant: MarkdownVariant.BORDERLESS,
    }),
    authInfo: Property.MarkDown({
      value: "**Authentication Required:**\nAdd an 'Authorization' header with Basic authentication using your SmarterMeasure username and password.\n",
      variant: MarkdownVariant.WARNING,
    }),
    specialEndpoints: Property.MarkDown({
      value: "**Special Endpoints:**\n\n- **Test Mode**: Append `/test` to the URL to receive data without triggering the flow\n- **Synchronous Mode**: Append `/sync` to receive a response from this flow (requires a Webhook Response step)\n",
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    assessmentId: '12345',
    userId: 'user123',
    completionDate: '2023-09-30T15:30:00Z',
    scores: {
      personalAttributes: 85,
      technicalCompetency: 78,
      technicalKnowledge: 92,
      lifeFactors: 88,
      learningStyles: {
        visual: 75,
        auditory: 60,
        verbal: 80,
        physical: 65,
        logical: 90,
        social: 70,
        solitary: 85
      }
    }
  },
  async onEnable() {
    // No additional setup required
  },
  async onDisable() {
    // No additional cleanup required
  },
  async run(context) {
    const { username, password } = context.auth as { username: string; password: string };
    const headers = (context.payload.headers ?? {}) as Record<string, string>;
    
    // Normalize header names to lowercase for reliable lookup
    const headersLc = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v as string])
    ) as Record<string, string>;
    
    // Check for Authorization header with Basic auth
    const authHeader = headersLc['authorization'];
    const expectedAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
    
    if (!authHeader || authHeader !== expectedAuth) {
      // Authentication failed
      return [];
    }
    
    // Authentication successful, return the assessment data
    return [context.payload.body];
  },
});
