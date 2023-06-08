import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  InjectionToken,
} from '@angular/core';
import { CollectionBuilderService } from '@activepieces/ui/feature-builder-store';
export const BLOG_URL_TOKEN = new InjectionToken<string>('BLOG_URL_TOKEN');
@Component({
  selector: 'app-template-blog-notification',
  templateUrl: './template-blog-notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./template-blog-notification.component.scss'],
})
export class TemplateBlogNotificationComponent {
  constructor(
    private builderService: CollectionBuilderService,
    @Inject(BLOG_URL_TOKEN) private blogUrl: string
  ) {}
  openBlog() {
    window.open(this.blogUrl, '_blank', 'noopener');
    this.close();
  }
  close() {
    this.builderService.componentToShowInsidePortal$.next(undefined);
  }
}
