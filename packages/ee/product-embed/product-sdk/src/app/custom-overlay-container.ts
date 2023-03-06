import { OverlayContainer } from '@angular/cdk/overlay';
export class CdkOverlayContainer extends OverlayContainer {
  /**
   * Create overlay container and append to ElementRef from directive
   */
  public myCreateContainer(element: HTMLElement): void {
    const container = document.createElement('div');
    element.appendChild(container);
    this._containerElement = container;
  }
  /**
   * Prevent creation of the HTML element, use custom method above
   */
  protected override _createContainer(): void {
    return;
  }
}
