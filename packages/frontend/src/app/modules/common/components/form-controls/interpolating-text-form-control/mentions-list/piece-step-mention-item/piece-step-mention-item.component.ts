import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { map, Observable, of, Subject, tap } from 'rxjs';
import { ActionType, PieceAction, PieceTrigger, TriggerType } from 'shared';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
import { FlowItemDetails } from 'src/app/modules/flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { ActionMetaService } from 'src/app/modules/flow-builder/service/action-meta.service';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/builder/builder.selector';
import { MentionListItem, MentionTreeNode, traverseStepOutputAndReturnMentionTree } from '../../utils';
import { MentionsTreeCacheService } from '../mentions-tree-cache.service';

@Component({
	selector: 'app-piece-step-mention-item',
	templateUrl: './piece-step-mention-item.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PieceStepMentionItemComponent {
	@Input()
	set stepMention(val: MentionListItem & { step: FlowItem }) {
		if (val.step.type !== ActionType.PIECE && val.step.type !== TriggerType.PIECE) {
			throw new Error('Step is not a piece action nor a piece trigger');
		}
		this._stepMention = val as MentionListItem & { step: PieceTrigger | PieceAction };
	}
	_stepMention: MentionListItem & { step: PieceTrigger | PieceAction };
	@Output() mentionClicked: EventEmitter<MentionListItem> = new EventEmitter();
	flowItemDetails$: Observable<FlowItemDetails | undefined>;
	sampleData$: Observable<{ children: MentionTreeNode[] | undefined; error: string }>;
	fetching$: Subject<boolean> = new Subject();
	noSampleDataNote$: Observable<string>;

	constructor(
		private store: Store,
		private actionMetaDataService: ActionMetaService,
		private mentionsTreeCache: MentionsTreeCacheService
	) {}
	ngOnInit(): void {
		const cacheResult = this.mentionsTreeCache.getStepMentionsTree(this._stepMention.step.name);
		if (cacheResult) {
			this.sampleData$ = of({ children: cacheResult, error: '' });
		}

		this.flowItemDetails$ = this.store.select(BuilderSelectors.selectFlowItemDetails(this._stepMention.step));
	}
	fetchSampleData() {
		this.sampleData$ = this.actionMetaDataService.getPieces().pipe(
			tap(() => {
				this.fetching$.next(true);
			}),
			map(pieces => {
				const step = this._stepMention.step;
				if (step.type === TriggerType.PIECE || step.type === ActionType.PIECE) {
					const piece = pieces.find(p => p.name === step.settings.pieceName);
					if (piece) {
						if (step.type === TriggerType.PIECE) {
							return step.settings.triggerName ? piece.triggers[step.settings.triggerName].sampleData ?? {} : {};
						} else {
							return step.settings.actionName ? piece.actions[step.settings.actionName].sampleData ?? {} : {};
						}
					}
				}
				throw new Error("Activepieces- step isn't of a piece type");
			}),
			map(sampleData => {
				const childrenNodes = traverseStepOutputAndReturnMentionTree(
					sampleData,
					this._stepMention.step.name,
					this._stepMention.step.displayName
				).children;
				return childrenNodes;
			}),
			map(res => {
				if (!res || res.length === 0) {
					const error = this.getErrorMessage();
					return { error: error, children: [] };
				}
				return { children: res, error: '' };
			}),
			tap(res => {
				this.mentionsTreeCache.setStepMentionsTree(this._stepMention.step.name, res.children);
				this.fetching$.next(false);
			})
		);
	}

	private getErrorMessage() {
		const actionOrTirggerText = this._stepMention.step.type === ActionType.PIECE ? 'action' : 'trigger';
		const triggerName =
			this._stepMention.step.type === TriggerType.PIECE ? this._stepMention.step.settings.triggerName : '';
		const actionName =
			this._stepMention.step.type === ActionType.PIECE ? this._stepMention.step.settings.actionName : '';
		const noSampleData = `No sample data was added to ${actionOrTirggerText}`;
		const error =
			!triggerName && !actionName
				? `Please select ${actionOrTirggerText === 'action' ? 'an action' : 'a trigger'} `
				: noSampleData;
		return error;
	}
}
