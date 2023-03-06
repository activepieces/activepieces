import {
  ComponentRef,
  Directive,
  ElementRef,
  Input,
  ViewContainerRef,
} from '@angular/core';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

@Directive({
  selector: '[appLoadingSpinner]',
})
export class LoadingSpinnerDirective {
  loadingSpinnerRef: ComponentRef<LoadingSpinnerComponent>;

  @Input() parentIsOutlineButton = false;

  @Input() set appLoadingSpinner(value: boolean) {
    if (value) {
      this.loadingSpinnerRef = this.viewContainerRef.createComponent(
        LoadingSpinnerComponent
      );
      const host = this.el.nativeElement as HTMLElement;
      if (this.parentIsOutlineButton) {
        this.outlineButtonSpinnerConfig();
      }

      host.insertBefore(
        this.loadingSpinnerRef.location.nativeElement,
        host.firstChild
      );
    } else if (this.loadingSpinnerRef) {
      this.loadingSpinnerRef.destroy();
    }
  }
  constructor(
    private el: ElementRef,
    private viewContainerRef: ViewContainerRef
  ) {
    const host = this.el.nativeElement as HTMLElement;
    host.onmouseenter = () => {
      if (this.loadingSpinnerRef) {
        this.addHoverSvgCssClass();
      }
    };
    host.onmouseleave = () => {
      if (this.loadingSpinnerRef) {
        this.removeHoverSvgCssClass();
      }
    };
  }

  outlineButtonSpinnerConfig() {
    this.loadingSpinnerRef.instance.parentIsOutlineButton = true;
    this.addHoverSvgCssClass();
  }

  addHoverSvgCssClass() {
    this.loadingSpinnerRef.instance.svgClasses =
      this.loadingSpinnerRef.instance.svgClasses.concat(
        ' ',
        this.loadingSpinnerRef.instance.hoveringClass
      );
    this.loadingSpinnerRef.instance.detectChanges();
  }

  removeHoverSvgCssClass() {
    this.loadingSpinnerRef.instance.svgClasses =
      this.loadingSpinnerRef.instance.svgClasses.replaceAll(
        ' '.concat(this.loadingSpinnerRef.instance.hoveringClass),
        ''
      );
    this.loadingSpinnerRef.instance.detectChanges();
  }
}
