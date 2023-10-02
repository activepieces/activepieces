import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  BuilderSelectors,
  CodeService,
  FlowItem,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';
import { Observable, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { ActionType, flowHelper } from '@activepieces/shared';
import { Store } from '@ngrx/store';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({ required: true })
  flowItem: FlowItem;
  duplicate$: Observable<void> | undefined;
  constructor(private codeService: CodeService, private store: Store) {}
  duplicateStep() {
    const artifacts$ = this.getCodeArtifacts();
    if (Object.keys(artifacts$).length > 0) {
      this.duplicate$ = forkJoin(artifacts$).pipe(
        switchMap((artifacts) => {
          return this.store
            .select(BuilderSelectors.selectShownFlowVersion)
            .pipe(
              take(1),
              tap((flowVersion) => {
                if (
                  this.flowItem &&
                  (this.flowItem.type === ActionType.CODE ||
                    this.flowItem.type === ActionType.PIECE ||
                    this.flowItem.type === ActionType.BRANCH ||
                    this.flowItem.type === ActionType.LOOP_ON_ITEMS)
                ) {
                  const duplicatedStep = flowHelper.duplicateStep(
                    this.flowItem,
                    artifacts,
                    flowHelper.findAvailableStepName(flowVersion, 'step')
                  );
                  this.store.dispatch(
                    FlowsActions.AddDuplicatedStep({
                      operation: {
                        duplicatedStep,
                        originalStepName: this.flowItem.name,
                      },
                    })
                  );
                }
              })
            );
        }),
        map(() => void 0)
      );
    } else {
      this.duplicate$ = this.store
        .select(BuilderSelectors.selectShownFlowVersion)
        .pipe(
          take(1),
          tap((flowVersion) => {
            if (
              this.flowItem &&
              (this.flowItem.type === ActionType.CODE ||
                this.flowItem.type === ActionType.PIECE ||
                this.flowItem.type === ActionType.BRANCH ||
                this.flowItem.type === ActionType.LOOP_ON_ITEMS)
            ) {
              const duplicatedStep = flowHelper.duplicateStep(
                this.flowItem,
                {},
                flowHelper.findAvailableStepName(flowVersion, 'step')
              );
              this.store.dispatch(
                FlowsActions.AddDuplicatedStep({
                  operation: {
                    duplicatedStep,
                    originalStepName: this.flowItem.name,
                  },
                })
              );
            }
          }),
          map(() => void 0)
        );
    }
  }
  private getCodeArtifacts() {
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
    return artifacts$;
  }
}
