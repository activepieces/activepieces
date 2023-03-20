import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  combineLatest,
  filter,
  forkJoin,
  from,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { CodeActionSettings } from '@activepieces/shared';

import { TestCodeFormModalComponent } from '../../../code-artifact-form-control/code-artifact-control-fullscreen/test-code-form-modal/test-code-form-modal.component';
import {
  MentionListItem,
  MentionTreeNode,
  traverseStepOutputAndReturnMentionTree,
} from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { fadeIn400ms } from '../../../../../animation/fade-in.animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CodeService } from '../../../../../../flow-builder/service/code.service';
import { FlowItem } from '../../../../../model/flow-builder/flow-item';

@Component({
  selector: 'app-code-step-mention-item',
  templateUrl: './code-step-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class CodeStepMentionItemComponent implements OnInit {
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
  @Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
  testDialogClosed$: Observable<object>;
  expandCodeCollapse = false;

  codeStepTest$: Observable<{
    children?: MentionTreeNode[];
    error?: boolean;
    value?: any;
    markedNodesToShow: Map<string, boolean>;
  }>;
  testing$: Subject<boolean> = new Subject();
  constructor(
    private dialogService: MatDialog,
    private codeService: CodeService,
    private mentionsTreeCache: MentionsTreeCacheService,
    private snackbar: MatSnackBar
  ) {}
  ngOnInit(): void {
    const cacheResult = this.mentionsTreeCache.getStepMentionsTree(
      this.stepMention.step.name
    );
    if (cacheResult) {
      this.codeStepTest$ = combineLatest({
        stepTree: of({
          children: cacheResult.children,
          value: cacheResult.value,
        }),
        search: this.mentionsTreeCache.listSearchBarObs$,
      }).pipe(
        map((res) => {
          const markedNodesToShow = this.mentionsTreeCache.markNodesToShow(
            this.stepMention.step.name,
            res.search
          );
          return {
            children: res.stepTree.children,
            error: false,
            markedNodesToShow: markedNodesToShow,
            value: res.stepTree.value,
          };
        })
      );
    }
  }
  openTestCodeModal() {
    const codeStepSettings = this.stepMention.step
      .settings as CodeActionSettings;
    const testData = codeStepSettings.input;
    const artifact$ = this.getArtifactObs$(codeStepSettings);
    this.testDialogClosed$ = this.dialogService
      .open(TestCodeFormModalComponent, { data: { testData: testData } })
      .afterClosed()
      .pipe(
        filter((res) => {
          return !!res;
        }),
        tap((context) => {
          this.testing$.next(true);
          this.snackbar.open(`Testing ${this.stepMention.label}...`, '', {
            duration: 1000,
          });
          this.codeStepTest$ = forkJoin({
            context: of(context),
            artifact: artifact$,
          }).pipe(
            switchMap((res) => {
              return this.codeService.executeTest(res.artifact, res.context);
            }),
            map((result) => {
              if (result.standardError) {
                return { error: true, children: [] };
              }
              const outputResult = result.output;
              if (typeof outputResult !== 'object') {
                return { children: [], value: outputResult };
              }
              const childrenNodes = traverseStepOutputAndReturnMentionTree(
                outputResult,
                this.stepMention.step.name,
                this.stepMention.step.displayName
              ).children;
              return { children: childrenNodes };
            }),
            tap((res) => {
              if (!res.error) {
                this.mentionsTreeCache.setStepMentionsTree(
                  this.stepMention.step.name,
                  { children: res.children || [], value: res.value }
                );
              }
            }),
            switchMap((res) => {
              return combineLatest({
                stepTree: of({ children: res.children, value: res.value }),
                search: this.mentionsTreeCache.listSearchBarObs$,
              }).pipe(
                map((res) => {
                  const markedNodesToShow =
                    this.mentionsTreeCache.markNodesToShow(
                      this.stepMention.step.name,
                      res.search
                    );
                  return {
                    children: res.stepTree.children,
                    error: false,
                    markedNodesToShow: markedNodesToShow,
                    value: res.stepTree.value,
                  };
                })
              );
            }),
            tap(() => {
              this.testing$.next(false);
            })
          );
        }),
        shareReplay(1)
      );
  }
  getArtifactObs$(codeStepSettings: CodeActionSettings) {
    if (codeStepSettings.artifactSourceId) {
      return this.codeService.downloadAndReadFile(
        CodeService.constructFileUrl(codeStepSettings.artifactSourceId)
      );
    } else {
      return from(this.codeService.readFile(atob(codeStepSettings.artifact!)));
    }
  }
  emitMention(mentionListItem: MentionListItem) {
    this.mentionClicked.emit(mentionListItem);
  }
}
