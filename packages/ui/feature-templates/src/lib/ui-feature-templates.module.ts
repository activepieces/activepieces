import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplatesDialogComponent } from './templates-dialog/templates-dialog.component';
import { TemplatesFiltersComponent } from './templates-dialog/templates-filters/templates-filters.component';
import { TemplateAppsDropdownComponent } from './templates-dialog/template-apps-dropdown/template-apps-dropdown.component';
import { TemplateAppTagContainerComponent } from './templates-dialog/template-apps-dropdown/template-app-tag-container/template-app-tag-container.component';
import { TemplateCardComponent } from './template-card/template-card.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { TemplateBlogNotificationComponent } from './template-blog-notification/template-blog-notification.component';
import { TimeagoModule } from 'ngx-timeago';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { TemplateDescriptionBannerColor } from './template-description-banner-color.pipe';
import { TemplateDescriptionComponent } from './templates-dialog/template-description/template-description.component';
const exportedDeclarations = [
  TemplatesDialogComponent,
  TemplatesFiltersComponent,
  TemplateAppsDropdownComponent,
  TemplateAppTagContainerComponent,
  TemplateCardComponent,
  TemplateBlogNotificationComponent,
  TemplateDescriptionBannerColor,
];
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeaturePiecesModule,
    TimeagoModule.forChild(),
  ],
  declarations: [...exportedDeclarations, TemplateDescriptionComponent],
  exports: exportedDeclarations,
})
export class UiFeatureTemplatesModule {}
