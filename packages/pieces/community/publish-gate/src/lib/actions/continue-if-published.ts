import {
  createAction,
  MarkdownVariant,
  Property,
  StopResponse,
} from '@activepieces/pieces-framework';
import {
  getCurrentFlowOrThrow,
  isPublishedForMode,
  PublishGateMode,
} from '../common/flow-status';

export const continueIfPublished = createAction({
  name: 'continue_if_published',
  displayName: 'Continue Only If Published',
  description:
    'Only lets the steps below run when this automation is published. Otherwise it stops the run so nothing below executes.',
  errorHandlingOptions: {
    // A gate must never be bypassable: "continue on failure" would let the
    // steps below run even if the publish check itself failed.
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    info: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value:
        'Place every step you only want to run on the **published** automation **below** this one.\n\nWhile you are building or testing, those steps are skipped automatically.',
    }),
    mode: Property.StaticDropdown<PublishGateMode>({
      displayName: 'When should the steps below run?',
      required: true,
      defaultValue: 'live',
      options: {
        disabled: false,
        options: [
          {
            label: 'Only when the published automation runs for real',
            value: 'live',
          },
          {
            label: 'Whenever the automation has been published',
            value: 'published',
          },
        ],
      },
    }),
  },
  async run(context) {
    const mode = context.propsValue.mode ?? 'live';
    const currentFlow = await getCurrentFlowOrThrow({ flows: context.flows });
    const allowedToContinue = isPublishedForMode({
      flow: currentFlow,
      runningVersionId: context.flows.current.version.id,
      mode,
    });

    if (allowedToContinue) {
      return {
        continued: true,
        reason: 'published',
      };
    }

    const response: StopResponse = {
      status: 200,
      body: {
        continued: false,
        reason: 'not_published',
        message:
          'This automation is not published yet, so the steps after this point were skipped.',
      },
    };
    context.run.stop({ response });
    return response.body;
  },
});
