// import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
// import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
// import { google } from 'googleapis';
// import { OAuth2Client } from 'googleapis-common';
// import { googleChatAuth } from '../common/auth';
// import dayjs from 'dayjs';

// const polling: Polling<PiecePropValueSchema<typeof googleChatAuth>, { space_id?: string }> = {
//   strategy: DedupeStrategy.TIMEBASED,
//   items: async ({ auth, propsValue, lastFetchEpochMS }) => {
//     const authClient = new OAuth2Client();
//     authClient.setCredentials(auth);
//     const chat = google.chat({ version: 'v1', auth: authClient });

//     const items: any[] = [];

//     // Get the authenticated user's info to check for mentions
//     const userResponse = await chat.users.get({
//       name: 'users/me',
//     });
//     const currentUser = userResponse.data;

//     if (propsValue.space_id) {
//       // Get messages from specific space
//       let spaceName = propsValue.space_id;
//       if (!propsValue.space_id.startsWith('spaces/')) {
//         spaceName = `spaces/${propsValue.space_id}`;
//       }

//       const response = await chat.spaces.messages.list({
//         parent: spaceName,
//         pageSize: 100,
//         orderBy: 'create_time desc',
//       });

//       if (response.data.messages) {
//         // Filter messages that mention the current user
//         const mentionedMessages = response.data.messages.filter(message => {
//           return message.annotations?.some(annotation => 
//             annotation.type === 'USER_MENTION' && 
//             annotation.userMention?.user?.name === currentUser.name
//           ) || message.argumentText?.includes(`@${currentUser.displayName}`);
//         });
//         items.push(...mentionedMessages);
//       }
//     } else {
//       // Get messages from all spaces
//       const spacesResponse = await chat.spaces.list({
//         pageSize: 100,
//         filter: 'spaceType = "SPACE"',
//       });

//       if (spacesResponse.data.spaces) {
//         for (const space of spacesResponse.data.spaces) {
//           try {
//             const messagesResponse = await chat.spaces.messages.list({
//               parent: space.name!,
//               pageSize: 50,
//               orderBy: 'create_time desc',
//             });

//             if (messagesResponse.data.messages) {
//               // Filter messages that mention the current user
//               const mentionedMessages = messagesResponse.data.messages.filter(message => {
//                 return message.annotations?.some(annotation => 
//                   annotation.type === 'USER_MENTION' && 
//                   annotation.userMention?.user?.name === currentUser.name
//                 ) || message.argumentText?.includes(`@${currentUser.displayName}`);
//               });
//               items.push(...mentionedMessages);
//             }
//           } catch (error) {
//             // Skip spaces where we can't read messages
//             continue;
//           }
//         }
//       }
//     }

//     return items
//       .filter(item => item.createTime && dayjs(item.createTime).valueOf() > (lastFetchEpochMS || 0))
//       .map((item) => ({
//         epochMilliSeconds: dayjs(item.createTime).valueOf(),
//         data: {
//           name: item.name,
//           text: item.text,
//           sender: item.sender,
//           createTime: item.createTime,
//           space: item.space,
//           thread: item.thread,
//           argumentText: item.argumentText,
//           annotations: item.annotations,
//           mentionedUser: currentUser,
//         },
//       }));
//   }
// };

// export const newMention = createTrigger({
//   auth: googleChatAuth,
//   name: 'newMention',
//   displayName: 'New Mention',
//   description: 'Fires when a new mention is received in a space',
//   props: {
//     space_id: Property.Dropdown({
//       displayName: 'Space (Optional)',
//       description: 'Select a specific space to monitor for mentions, or leave empty to monitor all spaces',
//       required: false,
//       refreshers: ['auth'],
//       options: async ({ auth }) => {
//         if (!auth) {
//           return {
//             disabled: true,
//             options: [],
//             placeholder: 'Please authenticate first',
//           };
//         }

//         try {
//           const authClient = new OAuth2Client();
//           authClient.setCredentials(auth);
//           const chat = google.chat({ version: 'v1', auth: authClient });
          
//           const response = await chat.spaces.list({
//             pageSize: 100,
//             filter: 'spaceType = "SPACE"',
//           });

//           const options = response.data.spaces?.map((space) => ({
//             label: space.displayName || space.name || 'Unnamed Space',
//             value: space.name || '',
//           })) || [];

//           return {
//             disabled: false,
//             options: options,
//           };
//         } catch (error) {
//           return {
//             disabled: true,
//             options: [],
//             placeholder: 'Error loading spaces',
//           };
//         }
//       },
//     }),
//   },
//   sampleData: {
//     name: 'spaces/SPACE_ID/messages/MESSAGE_ID',
//     text: 'Hey @John, can you help with this?',
//     sender: {
//       name: 'users/SENDER_ID',
//       displayName: 'Jane Doe',
//       type: 'HUMAN',
//     },
//     createTime: '2023-01-01T12:00:00Z',
//     space: {
//       name: 'spaces/SPACE_ID',
//       displayName: 'Sample Space',
//     },
//     thread: {
//       name: 'spaces/SPACE_ID/threads/THREAD_ID',
//     },
//     annotations: [
//       {
//         type: 'USER_MENTION',
//         userMention: {
//           user: {
//             name: 'users/USER_ID',
//             displayName: 'John Doe',
//           },
//         },
//       },
//     ],
//     mentionedUser: {
//       name: 'users/USER_ID',
//       displayName: 'John Doe',
//       type: 'HUMAN',
//     },
//   },
//   type: TriggerStrategy.POLLING,
//   async test(context) {
//     return await pollingHelper.test(polling, context);
//   },
//   async onEnable(context) {
//     const { store, auth, propsValue } = context;
//     await pollingHelper.onEnable(polling, { store, auth, propsValue });
//   },
//   async onDisable(context) {
//     const { store, auth, propsValue } = context;
//     await pollingHelper.onDisable(polling, { store, auth, propsValue });
//   },
//   async run(context) {
//     return await pollingHelper.poll(polling, context);
//   },
// });