import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  Injector,
  ViewContainerRef,
  createNgModule,
} from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-guess-flow-container',
  templateUrl: './guess-flow-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowContainerComponent {
  close$: Observable<boolean>;
  componentRef: ComponentRef<{ closeContainer: Subject<boolean> }> | null =
    null;
  constructor(private injector: Injector, private viewRef: ViewContainerRef) {
    this.showComponent();
  }

  async showComponent() {
    if (this.componentRef === null) {
      const GuessFlowModule = await import(
        '../../../../../../../../../ee/guess-flow/guess-flow.module'
      );
      const moduleRef = createNgModule(
        GuessFlowModule.GuessFlowModule,
        this.injector
      );

      this.componentRef = this.viewRef.createComponent(
        GuessFlowModule.GuessFlowComponentRef,
        {
          ngModuleRef: moduleRef,
        }
      );
      this.listenToCloseEvents();
    }
  }
  listenToCloseEvents(): void {
    // eslint-disable-next-line rxjs-angular/prefer-async-pipe
    const subscription = this.componentRef?.instance.closeContainer.subscribe(
      () => {
        this.componentRef?.destroy();
        this.componentRef = null;
        subscription?.unsubscribe();
      }
    );
  }
}
