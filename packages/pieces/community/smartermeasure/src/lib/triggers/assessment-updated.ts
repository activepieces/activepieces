import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { smarterMeasureAuth } from '../..';

export const assessmentUpdatedTrigger = createTrigger({
  auth: smarterMeasureAuth,
  name: 'assessment_updated',
  displayName: 'Assessment Updated',
  description: 'Triggers when a SmarterMeasure assessment is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    liveUrl: Property.MarkDown({
      value: "**Live URL:**\n```text\n{{webhookUrl}}\n```\nConfigure SmarterMeasure to send assessment update events to this URL.\n",
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
    updateDate: '2023-09-30T16:45:00Z',
    updatedFields: ['scores.technicalCompetency', 'scores.lifeFactors'],
    scores: {
      personalAttributes: 85,
      technicalCompetency: 82,
      technicalKnowledge: 92,
      lifeFactors: 90,
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
    // Return the updated assessment data that was sent by SmarterMeasure
    return [context.payload.body];
  },
});
