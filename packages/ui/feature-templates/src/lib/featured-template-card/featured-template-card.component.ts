import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  Flow,
  FlowOperationType,
  FlowTemplate,
  FolderId,
  TelemetryEventName,
  TriggerType,
} from '@activepieces/shared';
import { FlowService, TelemetryService } from '@activepieces/ui/common';
import { Observable, switchMap, tap } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CollectionBuilderService } from '@activepieces/ui/feature-builder-store';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  BLOG_URL_TOKEN,
  TemplateBlogNotificationComponent,
} from '../template-blog-notification/template-blog-notification.component';
@Component({
  selector: 'app-featured-template-card',
  templateUrl: './featured-template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedTemplateCardComponent implements OnInit {
  useTemplate$: Observable<Flow>;
  @Output() useTemplateClicked = new EventEmitter<FlowTemplate>();
  @Input() template: FlowTemplate = {
    imageUrl: 'https://www.activepieces.com/features/feat_2.svg',
    userId: '1234',
    user: {
      id: '',
      email: 'Ash@activepieces.com',
      firstName: 'Ash',
      lastName: 'Samhouri',
      imageUrl:
        'https://media.licdn.com/dms/image/D4D03AQGpekeVaUKatg/profile-displayphoto-shrink_200_200/0/1672226756859?e=1699488000&v=beta&t=lDlntCHC9FLArS__OVLxXfyQfes9FoTkQ9tiFWQe3gM',
      title: 'Co-founder and CEO',
    },
    id: 'iK9ktpb8OnzgdPGhPJeoD',
    created: '2023-07-25T12:04:38.851Z',
    updated: '2023-07-25T12:04:38.851Z',
    name: 'Automate Blog Writing with AI: A Step by Step Guide using OpenAI',
    description:
      "ChatGPT is awesome, you can ask it to write a blog post for you, make some modifications and publish it. But if you have hundreds of ideas that you'd like to convert into blog posts, you will need something that runs in the background while you're on the beach (just kidding, you'll be buried under lots of other work 😳).",
    template: {
      valid: true,
      trigger: {
        name: 'trigger',
        type: TriggerType.PIECE,
        valid: true,
        settings: {
          input: {
            sheet_id: 0,
            spreadsheet_id: '1qspr9MUZ7vkK1N9ePrcOhtv0WYfj654MYeXbMfBGMcU',
            include_team_drives: false,
          },
          pieceName: '@activepieces/piece-google-sheets',
          inputUiInfo: {},
          triggerName: 'new_row',
          pieceVersion: '~0.5.1',
        },
        nextAction: {
          name: 'step_6',
          type: 'PIECE',
          valid: true,
          settings: {
            input: {
              auth: "{{connections['openai']}}",
              model: 'gpt-3.5-turbo-0301',
              prompt:
                "Write a blog title about this idea: \"{{trigger['values']['A']}}\" and make sure it complies with these guidelines: {{trigger['values']['B']}}\n==\nRespond with the title without any quotation marks around it",
            },
            pieceName: '@activepieces/piece-openai',
            actionName: 'ask_chatgpt',
            inputUiInfo: {},
            pieceVersion: '~0.3.0',
          },
          nextAction: {
            name: 'step_1',
            type: 'PIECE',
            valid: true,
            settings: {
              input: {
                auth: "{{connections['openai']}}",
                model: 'gpt-3.5-turbo',
                prompt:
                  "Write a blog post about this idea: \"{{trigger['values']['A']}}\" and make sure it complies with these guidelines: \"{{trigger['values']['B']}}\"\n==\nonly respond with the text of the post",
              },
              pieceName: '@activepieces/piece-openai',
              actionName: 'ask_chatgpt',
              inputUiInfo: {},
              pieceVersion: '~0.3.0',
            },
            nextAction: {
              name: 'step_2',
              type: 'PIECE',
              valid: true,
              settings: {
                input: {
                  auth: null,
                  title: '{{step_6}}',
                  status: 'draft',
                  content: '{{step_1}}',
                },
                pieceName: '@activepieces/piece-wordpress',
                actionName: 'create_page',
                inputUiInfo: {},
                pieceVersion: '~0.3.0',
              },
              nextAction: {
                name: 'step_5',
                type: 'PIECE',
                valid: true,
                settings: {
                  input: {
                    cc: [],
                    bcc: [],
                    subject: '"{{step_1}}" is ready for your review!',
                    receiver: ['blog@example.com'],
                    reply_to: [],
                    body_text:
                      'Hi content team,\nA new blog post is ready for your review, please check your wordpress account',
                  },
                  pieceName: '@activepieces/piece-gmail',
                  actionName: 'send_email',
                  inputUiInfo: {},
                  pieceVersion: '~0.4.0',
                },
                displayName: 'Send Email',
              },
              displayName: 'Create Page',
            },
            displayName: 'Ask ChatGPT',
          },
          displayName: 'Ask ChatGPT',
        },
        displayName: 'New Row',
      },
      displayName:
        'Automate Blog Writing with AI: A Step by Step Guide using OpenAI',
    },
    tags: [],
    pieces: [
      '@activepieces/piece-google-sheets',
      '@activepieces/piece-openai',
      '@activepieces/piece-wordpress',
      '@activepieces/piece-gmail',
    ],
    pinnedOrder: null,
    blogUrl:
      'https://www.activepieces.com/blog/automate-blog-writing-with-ai-a-step-by-step-guide-using-openai',
  };
  activepiecesTeam = false;
  loading = false;
  @Input() folderId?: FolderId | null;
  constructor(
    private flowService: FlowService,
    private router: Router,
    private cd: ChangeDetectorRef,
    private matDialog: MatDialog,
    private telemetryService: TelemetryService,
    private builderService: CollectionBuilderService
  ) {}
  ngOnInit(): void {
    this.activepiecesTeam =
      this.template.user?.email.endsWith('activepieces.com') || false;
  }
  useTemplate() {
    if (!this.loading) {
      this.loading = true;
      this.useTemplate$ = this.flowService
        .create({
          displayName: this.template.name,
          folderId: this.folderId || undefined,
        })
        .pipe(
          switchMap((flow) => {
            return this.flowService
              .update(flow.id, {
                type: FlowOperationType.IMPORT_FLOW,
                request: this.template.template,
              })
              .pipe(
                tap((updatedFlow: Flow) => {
                  this.loading = false;
                  this.telemetryService.capture({
                    name: TelemetryEventName.FLOW_IMPORTED,
                    payload: {
                      id: this.template.id,
                      name: this.template.name,
                      location: this.template.pinnedOrder
                        ? 'Pins in dashboard'
                        : 'See all dialog in dashboard',
                    },
                  });
                  if (this.template.blogUrl) {
                    this.builderService.componentToShowInsidePortal$.next(
                      new ComponentPortal(
                        TemplateBlogNotificationComponent,
                        null,
                        Injector.create({
                          providers: [
                            {
                              provide: BLOG_URL_TOKEN,
                              useValue: this.template.blogUrl,
                            },
                          ],
                        })
                      )
                    );
                  }
                  this.router.navigate(['flows', updatedFlow.id]);
                })
              );
          })
        );
      this.matDialog.closeAll();
    }
    this.useTemplateClicked.emit(this.template);
  }
  ngAfterViewInit(): void {
    //This is a workaround to make tooltip appear.
    setTimeout(() => {
      this.cd.markForCheck();
    }, 100);
  }
}
