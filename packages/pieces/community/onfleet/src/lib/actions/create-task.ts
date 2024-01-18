import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';
import dayjs from 'dayjs';

export const createTask = createAction({
  auth: onfleetAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a task',
  props: {
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
    destination: common.destination,
    unparsedDestination: common.unparsedDestination,
    recipient: Property.DynamicProperties({
      displayName: 'Destination',
      description: 'The task destination',
      required: true,
      refreshers: ['useRecipientID'],
      props: async ({ useRecipientID }) => {
        let fields: DynamicPropsValue = {};
        if (useRecipientID) {
          fields = {
            id: Property.ShortText({
              displayName: 'Recipient ID',
              required: true,
            }),
          };
        } else {
          fields = {
            name: Property.ShortText({
              displayName: 'Name',
              description: "The recipient's full name",
              required: true,
            }),
            phone: Property.ShortText({
              displayName: 'Phone',
              description:
                "A unique, valid phone number as per the organization's country if there's no leading + sign. If a phone number has a leading + sign, it will disregard the organization's country setting.",
              required: true,
            }),
            notes: Property.ShortText({
              displayName: 'Notes',
              required: false,
            }),
            skipSMSNotifications: Property.Checkbox({
              displayName: 'Skip SMS Notifications',
              required: false,
              defaultValue: false,
            }),
          };
        }

        return fields;
      },
    }),
    useRecipientID: Property.Checkbox({
      displayName: 'Use Recipient ID',
      description: 'Check this box if you want to use an ID for the recipient',
      required: true,
      defaultValue: false,
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
    recipientName: Property.ShortText({
      displayName: 'Recipient Name Override',
      description: 'Override the recipient name for this task only',
      required: false,
    }),
    recipientNotes: Property.ShortText({
      displayName: 'Recipient Notes Override',
      description: 'Override the recipient notes for this task only',
      required: false,
    }),
    recipientSkipSMSNotifications: Property.Checkbox({
      displayName: 'Recipient Skip SMS Override',
      description: 'Override the recipient skip SMS option for this task only',
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
    let address;
    if (context.propsValue.unparsedDestination) {
      address = {
        number: '',
        street: '',
        city: '',
        country: '',
        unparsed: context.propsValue.destination['unparsedAddress'],
      };
    } else {
      address = {
        number: context.propsValue.destination['number'],
        street: context.propsValue.destination['street'],
        apartment: context.propsValue.destination['apartment'],
        city: context.propsValue.destination['city'],
        country: context.propsValue.destination['country'],
        state: context.propsValue.destination['state'],
        postalCode: context.propsValue.destination['postalCode'],
        name: context.propsValue.destination['name'],
      };
    }

    let recipients;
    if (context.propsValue.useRecipientID) {
      recipients = [context.propsValue.recipient['id']];
    } else {
      recipients = [
        {
          name: context.propsValue.recipient['name'],
          phone: context.propsValue.recipient['phone'],
          notes: context.propsValue.recipient['notes'],
          skipSMSNotifications:
            context.propsValue.recipient['skipSMSNotifications'],
        },
      ];
    }

    const completeAfter = context.propsValue.completeAfter
      ? dayjs(context.propsValue.completeAfter).valueOf()
      : undefined;
    const completeBefore = context.propsValue.completeBefore
      ? dayjs(context.propsValue.completeBefore).valueOf()
      : undefined;

    return await onfleetApi.tasks.create({
      destination: {
        address: address,
      },
      recipients: recipients,
      merchant: context.propsValue.merchant,
      executor: context.propsValue.executor,
      pickupTask: context.propsValue.pickupTask,
      quantity: context.propsValue.quantity,
      recipientName: context.propsValue.recipientName,
      recipientNotes: context.propsValue.recipientNotes,
      recipientSkipSMSNotifications:
        context.propsValue.recipientSkipSMSNotifications,
      serviceTime: context.propsValue.serviceTime,
      completeAfter: completeAfter,
      completeBefore: completeBefore,
    });
  },
});
