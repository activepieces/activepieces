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
    // Return the assessment data that was sent by SmarterMeasure
    return [context.payload.body];
  },
});
