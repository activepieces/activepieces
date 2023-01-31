import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { filter, forkJoin, from, map, Observable, of, shareReplay, Subject, switchMap, tap } from 'rxjs';
import { CodeActionSettings } from '@activepieces/shared';
import { FlowItem } from 'packages/frontend/src/app/modules/common/model/flow-builder/flow-item';
import { FlowItemDetails } from 'packages/frontend/src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { CodeService } from 'packages/frontend/src/app/modules/flow-builder/service/code.service';
import { BuilderSelectors } from 'packages/frontend/src/app/modules/flow-builder/store/builder/builder.selector';

import { TestCodeFormModalComponent } from '../../../code-artifact-form-control/code-artifact-control-fullscreen/test-code-form-modal/test-code-form-modal.component';
import { MentionListItem, MentionTreeNode, traverseStepOutputAndReturnMentionTree } from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';
import { fadeIn400ms } from '../../../../../animation/fade-in.animations';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
	selector: 'app-code-step-mention-item',
	templateUrl: './code-step-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [fadeIn400ms]
})
export class CodeStepMentionItemComponent implements OnInit {
	@Input() stepMention: MentionListItem & { step: FlowItem };
	@Input() stepIndex: number;
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	testDialogClosed$: Observable<object>;
	expandCodeCollapse: boolean = false;
	flowItemDetails$: Observable<FlowItemDetails | undefined>;
	codeStepTest$: Observable<{ children: MentionTreeNode[] | undefined; error?: boolean, value?: any }>;
	testing$: Subject<boolean> = new Subject();
	constructor(
		private store: Store,
		private dialogService: MatDialog,
		private codeService: CodeService,
		private mentionsTreeCache: MentionsTreeCacheService,
		private snackbar: MatSnackBar
	) { }
	ngOnInit(): void {
		const cacheResult = this.mentionsTreeCache.getStepMentionsTree(this.stepMention.step.name);
		if (cacheResult) {
			this.codeStepTest$ = of({ children: cacheResult.children, error: false, value: cacheResult.value });
		}
		this.flowItemDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetails(this.stepMention.step));
	}
	openTestCodeModal() {
		const codeStepSettings = this.stepMention.step.settings as CodeActionSettings;
		const testData = codeStepSettings.input;
		const artifact$ = this.getArtifactObs$(codeStepSettings);
		this.testDialogClosed$ = this.dialogService
			.open(TestCodeFormModalComponent, { data: { testData: testData } })
			.afterClosed()
			.pipe(
				filter(res => {
					return !!res;
				}),
				tap((context) => {
					this.testing$.next(true);
					this.snackbar.open(`Testing ${this.stepMention.label}...`, '', { duration: 1000 })
					this.codeStepTest$ = forkJoin({
						context: of(context),
						artifact: artifact$,
					}).pipe(switchMap(res => {
						return this.codeService.executeTest(res.artifact, res.context);
					}),
						tap(() => {
							this.testing$.next(false);
						}),
						map(result => {
							if (result.standardError) {
								return { error: true, children: [] };
							}
							const outputResult = result.output;
							if (typeof outputResult !== 'object') { return { children: [], value: outputResult } };
							const childrenNodes = traverseStepOutputAndReturnMentionTree(
								outputResult,
								this.stepMention.step.name,
								this.stepMention.step.displayName
							).children;
							return { children: childrenNodes };
						}),
						tap(res => {
							this.mentionsTreeCache.setStepMentionsTree(this.stepMention.step.name, { children: res.children || [], value: res.value });
						}),
						shareReplay(1));
				}),
				shareReplay(1)
			);
	}
	getArtifactObs$(codeStepSettings: CodeActionSettings) {
		if (codeStepSettings.artifactSourceId) {
			return this.codeService.downloadAndReadFile(CodeService.constructFileUrl(codeStepSettings.artifactSourceId));
		} else {
			return from(this.codeService.readFile(atob(codeStepSettings.artifact!)));
		}
	}
	emitMention(mentionListItem: MentionListItem) {
		this.mentionClicked.emit(mentionListItem);
	}
}
