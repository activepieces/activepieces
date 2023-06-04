import { Injectable } from '@angular/core';
import { delay, of } from 'rxjs';
import {
  FlowTemplate,
  FlowVersion,
  FlowVersionState,
  TriggerType,
} from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class TemplatesService {
  template: FlowTemplate & { template: FlowVersion } = {
    description:
      "ChatGPT is awesome, you can ask it to write a blog post for you, make some modifications and publish it. But if you have hundreds of ideas that you'd like to convert into blog posts, you will need something that runs in the background while you're on the beach (just kidding, you'll be buried under lots of other work 😳).",
    name: 'Automate Blog Writing with AI: A Step by Step Guide using OpenAI',
    pieces: ['google-sheets', 'openai', 'wordpress', 'gmail'],
    tags: [],
    template: {
      flowId: 'mjTPcRA5uKPQKerEM8T1C',
      created: '2021-09-30T14:00:00.000Z',
      updated: '2021-09-30T14:00:00.000Z',
      id: 'mjTPcRA5uKPQKerEM8T1C',
      displayName:
        'Automate Blog Writing with AI: A Step by Step Guide using OpenAI',
      trigger: {
        name: 'trigger',
        type: TriggerType.PIECE,
        valid: true,
        settings: {
          input: {
            sheet_id: 0,
            spreadsheet_id: '1r4fJdcq2XA7z4tse18oJzkwJx1RLS5N6PkGf48DOeZ0',
          },
          pieceName: 'google-sheets',
          inputUiInfo: {},
          triggerName: 'new_row_added',
          pieceVersion: '0.1.3',
        },
        nextAction: {
          name: 'step_1',
          type: 'PIECE',
          valid: true,
          settings: {
            input: {
              model: null,
              prompt:
                'Write a blog title about this idea: "{{trigger.value[0]}}" and make sure it complies with these guidelines: {{trigger.value[1]}}\n==\nRespond with the title without any quotation marks around it',
            },
            pieceName: 'openai',
            actionName: 'ask_chatgpt',
            inputUiInfo: {},
            pieceVersion: '0.1.3',
          },
          nextAction: {
            name: 'step_2',
            type: 'PIECE',
            valid: true,
            settings: {
              input: {
                prompt:
                  'Write a blog post about this idea: "{{trigger.value[0]}}" and make sure it complies with these guidelines: "{{trigger.value[1]}}"\n==\nonly respond with the text of the post',
              },
              pieceName: 'openai',
              actionName: 'ask_chatgpt',
              inputUiInfo: {},
              pieceVersion: '0.1.3',
            },
            nextAction: {
              name: 'step_4',
              type: 'PIECE',
              valid: true,
              settings: {
                input: {
                  title: '{{step_1}}',
                  status: 'draft',
                  content: '{{step_2}}',
                  website_url: '{{configs.blog_url}}',
                },
                pieceName: 'wordpress',
                actionName: 'create_post',
                inputUiInfo: {},
                pieceVersion: '0.1.3',
              },
              nextAction: {
                name: 'step_3',
                type: 'PIECE',
                valid: true,
                settings: {
                  input: {
                    subject: '"{{step_1}}" is ready for your review!',
                    receiver: 'blog@activepieces.com',
                    body_text:
                      'Hi content team,\nA new blog post is ready for your review, here is the link: {{configs.blog_url}}wp-admin/post.php?post={{step_4.body.id}}&action=edit',
                  },
                  pieceName: 'gmail',
                  actionName: 'send_email',
                  inputUiInfo: {},
                  pieceVersion: '0.1.3',
                },
                displayName: 'Gmail',
              },
              displayName: 'Wordpress',
            },
            displayName: 'Open AI',
          },
          displayName: 'Open AI',
        },
        displayName: 'Trigger',
      },
      valid: true,
      state: FlowVersionState.DRAFT,
    },
  };

  getTemplates(params: { search: string; apps: string[]; filters: string[] }) {
    console.log(params);
    return of([
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
      this.template,
    ]).pipe(delay(500));
  }
}
