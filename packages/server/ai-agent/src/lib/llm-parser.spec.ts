import { llmMessageParser } from './llm-parser'

describe('llmMessageParser', () => {
  describe('parse', () => {
    it('should parse plain text message', () => {
      const message = 'Hello world'
      const result = llmMessageParser.parse(message)

      expect(result).toEqual({
        blocks: [
          {
            type: 'text',
            text: message
          }
        ]
      })
    })

    it('should parse message with multiple operations', () => {
      const message = `Here's what I'll do:

<apOperations>
    <apOperation>
        <type>updateTrigger</type>
        <triggerType>schedule</triggerType>
        <cron>0 0 10 * * *</cron>
    </apOperation>
    <apOperation displayName="Send Discord Message" id="step_1" type="createAction">
        <inputs>
            <message>Time to drink water! 💧</message>
            <channelId>https://discordapp.com/api/webhooks/1333044326372216923/igJfsudSpGkjSIXtMsXjYy57D9Q9_JwUDW7hvYkte14xvaxvMg8scCsWA4PNAHjqy2WP</channelId>
        </inputs>
        <code>export const code = {
    props: {
        message: {
            type: "SHORT_TEXT",
            displayName: "Message",
            description: "The message to send to Discord",
            required: true
        },
        webhookUrl: {
            type: "SHORT_TEXT",
            displayName: "Webhook URL", 
            description: "The Discord webhook URL to send the message to",
            required: true
        }
    },
    run: async({ inputs }) => {
        const response = await fetch(inputs.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: inputs.message
            })
        });
        
        return await response.json();
    }
}</code>
    </apOperation>
</apOperations>`

      const result = llmMessageParser.parse(message)

      expect(result).toEqual({
        blocks: [
          {
            type: 'text',
            text: "Here's what I'll do:"
          },
          {
            type: 'operations',
            operations: [
              {
                type: 'updateTrigger',
                triggerType: 'schedule',
                cron: '0 0 10 * * *'
              },
              {
                type: 'createAction',
                displayName: 'Send Discord Message',
                id: 'step_1',
                inputs: {
                  message: 'Time to drink water! 💧',
                  channelId: 'https://discordapp.com/api/webhooks/1333044326372216923/igJfsudSpGkjSIXtMsXjYy57D9Q9_JwUDW7hvYkte14xvaxvMg8scCsWA4PNAHjqy2WP'
                },
                code: `export const code = {
    props: {
        message: {
            type: "SHORT_TEXT",
            displayName: "Message",
            description: "The message to send to Discord",
            required: true
        },
        webhookUrl: {
            type: "SHORT_TEXT",
            displayName: "Webhook URL", 
            description: "The Discord webhook URL to send the message to",
            required: true
        }
    },
    run: async({ inputs }) => {
        const response = await fetch(inputs.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: inputs.message
            })
        });
        
        return await response.json();
    }
}`
              }
            ]
          }
        ]
      })
    })


  })
})