import { Property } from "@activepieces/pieces-framework"

  export const activityTextContent = {
    id:{
        description: 'ID of the activity to update.',
        displayName: 'ID',
    },
    event:{
        description: 'Name to show in your customer activity table. i.e "Invoices Sync"',
        displayName: 'Activity Name',
    },
    status:{
        description: 'Status of user activity. i.e "Pending"',
        displayName: 'Status',
    },
    message:{
        description: 'Describes the activity in a more detailed way. i.e "Synced 10 invoices, 20 remain"',
        displayName: 'Message',
    },
  }


export const  props= {
    event: Property.ShortText({
      displayName: activityTextContent.event.displayName,
      description: activityTextContent.event.description,
      required: true,
    }),
    message: Property.LongText({
      displayName: activityTextContent.message.displayName,
      description: activityTextContent.message.description,
      required: true,
    }),
    status: Property.ShortText({
      displayName: activityTextContent.status.displayName,
      description:  activityTextContent.status.description,
      required: true,
    }),
  }