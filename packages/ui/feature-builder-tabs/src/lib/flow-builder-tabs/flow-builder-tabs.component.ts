import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  exhaustMap,
  forkJoin,
  fromEvent,
  map,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { Flow } from '@activepieces/shared';
import {
  FlowService,
  findDefaultFlowDisplayName,
} from '@activepieces/ui/common';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-flow-builder-tabs',
  templateUrl: './flow-builder-tabs.component.html',
  styleUrls: ['./flow-builder-tabs.component.scss'],
})
export class FlowBuilderTabsComponent implements OnInit, AfterViewInit {
  flows$: Observable<Flow[]>;
  isFlowSelected$: Observable<boolean>;
  viewSingleMode: boolean;

  readOnlyMode$: Observable<boolean>;
  selectedFlowId$: Observable<UUID | null>;
  @ViewChild('addFlowBtn') addFlowButton: ElementRef;
  @ViewChildren('flowSpan') flowSpans: QueryList<ElementRef>;

  addFlowButton$: Observable<void> = new Observable<void>();

  constructor(private flowService: FlowService, private store: Store) {}

  ngOnInit(): void {
    this.selectedFlowId$ = this.store.select(
      BuilderSelectors.selectCurrentFlowId
    );
    this.isFlowSelected$ = this.store.select(
      BuilderSelectors.selectFlowSelectedId
    );
    this.readOnlyMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.flows$ = this.store.select(BuilderSelectors.selectFlows);
  }

  ngAfterViewInit(): void {
    this.setupAddFlowButtonListener();
  }

  setupAddFlowButtonListener() {
    this.addFlowButton$ = fromEvent(this.addFlowButton.nativeElement, 'click')
      .pipe(exhaustMap(() => this.createEmptyFlow()))
      .pipe(
        tap((response) => {
          if (response) {
            this.scrollToLastTab();
          }
        }),
        map((value) => void 0)
      );
  }

  changeSelectedFlow(flow: Flow) {
    this.store.dispatch(FlowsActions.selectFlow({ flowId: flow.id }));
  }

  scrollFlowTabsLeft(tabsContainer: HTMLDivElement) {
    tabsContainer.scrollTo({
      left: tabsContainer.scrollLeft - tabsContainer.clientWidth,
      behavior: 'smooth',
    });
  }

  scrollFlowTabsRight(tabsContainer: HTMLDivElement) {
    tabsContainer.scrollTo({
      left: tabsContainer.scrollLeft + tabsContainer.clientWidth,
      behavior: 'smooth',
    });
  }

  shouldShowRightArrow(tabsContainer: HTMLDivElement) {
    return !(
      tabsContainer.scrollLeft + tabsContainer.clientWidth ==
      tabsContainer.scrollWidth
    );
  }

  shouldShowLeftArrow(tabsContainer: HTMLDivElement) {
    return tabsContainer.scrollLeft > 0;
  }

  scrollToFlowTab(flowSpanIndex: number) {
    (
      this.flowSpans.toArray()[flowSpanIndex].nativeElement as HTMLSpanElement
    ).scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'end',
    });
    setTimeout(() => {
      (
        this.flowSpans.toArray()[flowSpanIndex].nativeElement as HTMLSpanElement
      ).scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'end',
      });
    }, 100);
  }

  scrollToLastTab() {
    setTimeout(() => {
      (this.flowSpans.last.nativeElement as HTMLSpanElement).scrollIntoView({
        behavior: 'smooth',
        block: 'end',
        inline: 'end',
      });
    }, 400);
  }
  createEmptyFlow() {
    return forkJoin({
      collection: this.store
        .select(BuilderSelectors.selectCurrentCollection)
        .pipe(take(1)),
      flows: this.store.select(BuilderSelectors.selectFlows).pipe(take(1)),
    })
      .pipe(
        switchMap((collectionWIthFlows) => {
          const flowDisplayName = findDefaultFlowDisplayName(
            collectionWIthFlows.flows
          );
          return this.flowService.create({
            collectionId: collectionWIthFlows.collection.id,
            displayName: flowDisplayName,
          });
        })
      )
      .pipe(
        tap((response) => {
          if (response) {
            this.store.dispatch(FlowsActions.addFlow({ flow: response }));
          }
        })
      );
  }
}
