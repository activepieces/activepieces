import { createAction, Property } from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { markdownDescription } from '../common';
import { delayUntilActionOutputSchema } from '../output-schemas';

export const delayUntilAction = createAction({
  audience: 'both',
  name: 'delay_until',
  displayName: 'Delay Until',
  description:
    'Delays the execution of the next action until a given timestamp',
  aiMetadata: { description: 'Suspends the flow until one absolute date/time (ISO and other parseable formats) and then continues with the next step; a timestamp already in the past resumes immediately, and waits longer than a minute suspend the run rather than sleeping in-process. Choose this when the resume point is a known calendar instant, and prefer Delay For when you only know a relative duration. Requires the target timestamp, which must be parseable - an unparseable value throws instead of continuing - and the wait cannot exceed the instance paused-flow timeout; idempotent, it changes no data.', idempotent: true },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    markdown: Property.MarkDown({
      value: markdownDescription,
    }),
    delayUntilTimestamp: Property.DateTime({
      displayName: 'Date and Time',
      description:
        'Specifies the date and time until which the execution of the next action should be delayed. It supports multiple formats, including ISO format.',
      required: true,
    }),
  },
  outputSchema: delayUntilActionOutputSchema,
  async run(ctx) {
    const delayTill = parseTimestampOrThrow(ctx.propsValue.delayUntilTimestamp);
    const delayInMs = delayTill.getTime() - Date.now();
    if (ctx.executionType == ExecutionType.RESUME) {
      return {
        delayTill: delayTill,
        success: true,
      };
    } else if (delayInMs <= 0) {
      // resume immediately
      return {
        delayTill: delayTill,
        success: true,
      };
    } else if (delayInMs > 1 * 60 * 1000) {
      // use flow pause
      const currentTime = new Date();
      const futureTime = dayjs(currentTime.getTime() + delayInMs);
      const waitpoint = await ctx.run.createWaitpoint({
        type: 'DELAY',
        resumeDateTime: futureTime.toISOString(),
      });
      ctx.run.waitForWaitpoint(waitpoint.id);
      return {};
    } else {
      // use setTimeout for delayTill between 0 and 5 seconds
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
      return {
        delayTill: delayTill,
        success: true,
      };
    }
  },

  async test(ctx) {
    const delayTill = parseTimestampOrThrow(ctx.propsValue.delayUntilTimestamp);
    return {
      delayTill,
      success: true,
    };
  }
});

/**
 * An unparseable timestamp used to yield an invalid Date, making every
 * comparison against `delayInMs` false and falling through to
 * `setTimeout(resolve, NaN)` — coerced to 1ms. The step then reported
 * `success: true` with a null `delayTill` after waiting no time at all, so a
 * flow that was meant to wait silently did not. Fail loudly instead.
 */
function parseTimestampOrThrow(timestamp: string): Date {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid Date and Time: "${timestamp}" could not be parsed. Use ISO format, e.g. 2026-08-05T14:30:00Z.`
    );
  }
  return parsed;
}
