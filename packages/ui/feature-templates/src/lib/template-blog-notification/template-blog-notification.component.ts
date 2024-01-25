import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  InjectionToken,
} from '@angular/core';

import { FlagService, FlowBuilderService } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { ApFlagId } from '@activepieces/shared';
export const BLOG_URL_TOKEN = new InjectionToken<string>('BLOG_URL_TOKEN');
@Component({
  selector: 'app-template-blog-notification',
  templateUrl: './template-blog-notification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./template-blog-notification.component.scss'],
})
export class TemplateBlogNotificationComponent {
  showBlogGuide$: Observable<boolean>;

  constructor(
    private builderService: FlowBuilderService,
    private flagsService: FlagService,
    @Inject(BLOG_URL_TOKEN) private blogUrl: string
  ) {
    this.showBlogGuide$ = this.flagsService.isFlagEnabled(
      ApFlagId.SHOW_COMMUNITY
    );
  }
  openBlog() {
    window.open(this.blogUrl, '_blank', 'noopener');
    this.close();
  }
  close() {
    this.builderService.componentToShowInsidePortal$.next(undefined);
  }
}
