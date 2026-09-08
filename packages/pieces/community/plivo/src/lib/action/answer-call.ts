import {
  createAction,
  DynamicPropsValue,
  PieceAuth,
  Property,
  StopResponse,
} from '@activepieces/pieces-framework';

enum AnswerType {
  SPEAK = 'speak',
  PLAY = 'play',
  RAW = 'raw',
}

const XML_CONTENT_TYPE = 'text/xml';

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export const plivoAnswerCall = createAction({
  name: 'answer_call',
  displayName: 'Answer Call',
  description: 'Answer a ringing call by returning Plivo XML to Plivo',
  audience: 'both',
  requireAuth: false,
  aiMetadata: {
    description:
      'Answers an inbound Plivo call by returning Plivo XML in the webhook response. Use as the final step of a flow started by the New Incoming Call trigger, to speak a message, play an audio file, or return hand-written Plivo XML. This action produces the HTTP response Plivo is waiting for, so the flow stops when it runs.',
    idempotent: true,
  },
  props: {
    answer_type: Property.StaticDropdown({
      displayName: 'Answer With',
      description: 'What Plivo should do when the call connects.',
      required: true,
      defaultValue: AnswerType.SPEAK,
      options: {
        options: [
          { label: 'Spoken message', value: AnswerType.SPEAK },
          { label: 'Audio file', value: AnswerType.PLAY },
          { label: 'Plivo XML', value: AnswerType.RAW },
        ],
      },
    }),
    fields: Property.DynamicProperties({
      auth: PieceAuth.None(),
      displayName: 'Response',
      refreshers: ['answer_type'],
      required: true,
      props: async ({ answer_type }) => {
        const fields: DynamicPropsValue = {};
        switch (answer_type as unknown as AnswerType) {
          case AnswerType.SPEAK:
            fields['text'] = Property.LongText({
              displayName: 'Message',
              description: 'The text Plivo reads to the caller.',
              required: true,
            });
            break;
          case AnswerType.PLAY:
            fields['audio_url'] = Property.ShortText({
              displayName: 'Audio URL',
              description:
                'A publicly reachable URL of an audio file Plivo plays to the caller.',
              required: true,
            });
            break;
          case AnswerType.RAW:
            fields['xml'] = Property.LongText({
              displayName: 'Plivo XML',
              description:
                'A complete Plivo XML document, for example <Response><Speak>Hello</Speak></Response>.',
              required: true,
            });
            break;
          default:
            return {};
        }
        return fields;
      },
    }),
  },
  async run(context) {
    const { answer_type, fields } = context.propsValue;

    let body: string;
    switch (answer_type as AnswerType) {
      case AnswerType.SPEAK:
        body = `<Response><Speak>${escapeXml(
          String(fields['text'] ?? '')
        )}</Speak></Response>`;
        break;
      case AnswerType.PLAY:
        body = `<Response><Play>${escapeXml(
          String(fields['audio_url'] ?? '')
        )}</Play></Response>`;
        break;
      case AnswerType.RAW:
        body = String(fields['xml'] ?? '');
        break;
      default:
        throw new Error(
          `Cannot answer the call because the answer type ${String(
            answer_type
          )} is not supported.`
        );
    }

    const response: StopResponse = {
      status: 200,
      headers: { 'Content-Type': XML_CONTENT_TYPE },
      body,
    };

    context.run.stop({ response });

    return response;
  },
});
