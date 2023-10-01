import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CodeService, FlowItem } from '@activepieces/ui/feature-builder-store';
import { Observable, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { ActionType, TriggerType, flowHelper } from '@activepieces/shared';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({ required: true })
  flowItem: FlowItem;
  duplicate$: Observable<void> | undefined;
  constructor(private codeService: CodeService) {}
  duplicateStep() {
    const artifacts$: Record<string, Observable<string>> = {};
    if (this.flowItem.type === ActionType.CODE) {
      if (this.flowItem.settings.artifact) {
        artifacts$[this.flowItem.name] = of(this.flowItem.settings.artifact);
      } else if (this.flowItem.settings.artifactSourceId) {
        artifacts$[this.flowItem.name] = this.codeService
          .downloadAndReadFile(
            CodeService.constructFileUrl(
              this.flowItem.settings.artifactSourceId
            )
          )
          .pipe(
            switchMap((res) => {
              return CodeService.zipFile(res);
            })
          );
      }
    }
    if (
      this.flowItem.type === ActionType.BRANCH ||
      this.flowItem.type === ActionType.LOOP_ON_ITEMS
    ) {
      const childSteps = flowHelper.getAllChildSteps(this.flowItem);
      childSteps.forEach((c) => {
        if (c.type === ActionType.CODE) {
          if (c.settings.artifact) {
            artifacts$[c.name] = of(c.settings.artifact);
          }
          if (c.settings.artifactSourceId) {
            artifacts$[c.name] = this.codeService
              .downloadAndReadFile(
                CodeService.constructFileUrl(c.settings.artifactSourceId)
              )
              .pipe(
                switchMap((res) => {
                  return CodeService.zipFile(res);
                })
              );
          }
        }
      });
    }

    this.duplicate$ = forkJoin(artifacts$).pipe(
      tap((artifacts) => {
        if (
          this.flowItem &&
          this.flowItem.type !== TriggerType.WEBHOOK &&
          this.flowItem.type !== TriggerType.PIECE &&
          this.flowItem.type !== TriggerType.EMPTY
        ) {
          console.log(flowHelper.duplicateStep(this.flowItem, artifacts));
        }
      }),
      map(() => void 0)
    );
  }
}
