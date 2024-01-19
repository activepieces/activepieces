import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';

import Onfleet from '@onfleet/node-onfleet';
import dayjs from 'dayjs';

export const updateTask = createAction({
  auth: onfleetAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Updates a task',
  props: {
    task: Property.ShortText({
      displayName: 'Task ID',
      description: 'ID of the task you want to update',
      required: true,
    }),
    merchant: Property.ShortText({
      displayName: 'Merchant ID',
      description: 'ID of the organization that will be displayed on the task',
      required: false,
    }),
    executor: Property.ShortText({
      displayName: 'Executor ID',
      description: 'ID of the organization that will be executing the task',
      required: false,
    }),
    completeAfter: Property.DateTime({
      displayName: 'Complete After',
      description: 'The earliest time the task should be completed',
      required: false,
    }),
    completeBefore: Property.DateTime({
      displayName: 'Complete Before',
      description: 'The latest time the task should be completed',
      required: false,
    }),
    pickupTask: Property.Checkbox({
      displayName: 'Pickup',
      description: 'Whether the task is pickup',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'The number of units to be dropped off',
      required: false,
    }),
    serviceTime: Property.Number({
      displayName: 'Service Time',
      description:
        "The number of minutes to be spent by the worker on arrival at this task's destination",
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    const completeAfter = context.propsValue.completeAfter
      ? dayjs(context.propsValue.completeAfter).valueOf()
      : undefined;
    const completeBefore = context.propsValue.completeBefore
      ? dayjs(context.propsValue.completeBefore).valueOf()
      : undefined;

    return await onfleetApi.tasks.update(context.propsValue.task, {
      merchant: context.propsValue.merchant,
      executor: context.propsValue.executor,
      pickupTask: context.propsValue.pickupTask,
      quantity: context.propsValue.quantity,
      serviceTime: context.propsValue.serviceTime,
      completeAfter: completeAfter,
      completeBefore: completeBefore,
    });
  },
});
