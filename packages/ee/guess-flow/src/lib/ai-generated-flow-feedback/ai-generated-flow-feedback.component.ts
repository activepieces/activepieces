import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthenticationService, fadeIn400ms } from '@activepieces/ui/common';
import { CollectionBuilderService } from '@activepieces/ui/feature-builder-store';
import { MatDialog } from '@angular/material/dialog';
import { AiFeedbackDialogComponent } from './ai-feedback-dialog/ai-feedback-dialog.component';
import { Observable, switchMap, tap } from 'rxjs';
import { PromptsService } from '../services/prompts.service';

@Component({
  selector: 'app-ai-generated-flow-feedback',
  templateUrl: './ai-generated-flow-feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class AiGeneratedFlowFeedbackComponent {
  feedbackDialogClosed$: Observable<unknown>;
  constructor(
    private builderService: CollectionBuilderService,
    private matDialog: MatDialog,
    private authenticationService: AuthenticationService,
    private promptsService: PromptsService
  ) {}
  close() {
    this.builderService.componentToShowInsidePortal$.next(undefined);
  }
  react(like: boolean) {
    this.feedbackDialogClosed$ = this.matDialog
      .open(AiFeedbackDialogComponent, { data: { like } })
      .afterClosed()
      .pipe(
        switchMap((feedback) => {
          const prompt = localStorage.getItem('LAST_PROMPT') || '';
          const flow = localStorage.getItem('LAST_FLOW_GENERATED') || '';
          const email = this.authenticationService.currentUser.email;
          return this.promptsService.saveFeedback({
            like,
            flow,
            prompt,
            feedback,
            email,
          });
        }),
        tap(() => {
          this.close();
        })
      );
  }
}
