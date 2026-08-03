import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { ExecutionType } from '@activepieces/pieces-framework';
import { markdownDescription } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

enum TimeUnit {
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days',
}

export const delayForAction = createAction({
  audience: 'both',
  name: 'delayFor',
  displayName: 'Delay For',
  description: 'Delays the execution of the next action for a given duration',
  aiMetadata: { description: 'Pauses the flow for a fixed relative duration before the next step runs, given as an amount plus a unit (seconds, minutes, hours or days); short waits sleep in-process while longer ones suspend the run and resume it later. Pick this when the wait is known relative to now, and prefer Delay Until when you have an absolute target date/time. The amount must be non-negative and the wait cannot exceed the instance paused-flow timeout; idempotent, nothing is created or mutated.', idempotent: true },
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
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      description: 'The unit of time to delay the execution of the next action',
      required: true,
      options: {
        options: [
          { value: TimeUnit.SECONDS, label: 'Seconds' },
          { value: TimeUnit.MINUTES, label: 'Minutes' },
          { value: TimeUnit.HOURS, label: 'Hours' },
          { value: TimeUnit.DAYS, label: 'Days' },
        ],
      },
      defaultValue: TimeUnit.SECONDS,
    }),
    delayFor: Property.Number({
      displayName: 'Amount',
      description:
        'The number of units to delay the execution of the next action',
      required: true,
    }),
  },
  async run(ctx) {
    await propsValidation.validateZod(ctx.propsValue, {
      delayFor: z.number().check(z.minimum(0)),
    });

    const unit = ctx.propsValue.unit ?? TimeUnit.SECONDS;
    const delayInMs = calculateDelayInMs(ctx.propsValue.delayFor, unit);
    if (ctx.executionType == ExecutionType.RESUME) {
      return {
        delayForInMs: delayInMs,
        success: true,
      };
    } else if (delayInMs > 1 * 10 * 1000) {
      // use flow pause
      const currentTime = new Date();
      const futureTime = new Date(currentTime.getTime() + delayInMs);
      const waitpoint = await ctx.run.createWaitpoint({
        type: 'DELAY',
        resumeDateTime: futureTime.toUTCString(),
      });
      ctx.run.waitForWaitpoint(waitpoint.id);
      return {};
    } else {
      // use setTimeout
      await new Promise((resolve) => setTimeout(resolve, delayInMs));
      return {
        delayForInMs: delayInMs,
        success: true,
      };
    }
  },
  async test(ctx) {
    const unit = ctx.propsValue.unit ?? TimeUnit.SECONDS;
    return {
      delayForInMs: calculateDelayInMs(ctx.propsValue.delayFor, unit),
      success: true,
    };
  }
});

function calculateDelayInMs(amount: number, unit: TimeUnit): number {
  let delayInMs: number;
  switch (unit) {
    case TimeUnit.SECONDS:
      delayInMs = amount * 1000;
      break;
    case TimeUnit.MINUTES:
      delayInMs = amount * 60 * 1000;
      break;
    case TimeUnit.HOURS:
      delayInMs = amount * 60 * 60 * 1000;
      break;
    case TimeUnit.DAYS:
      delayInMs = amount * 24 * 60 * 60 * 1000;
      break;
  }
  return delayInMs;
}
