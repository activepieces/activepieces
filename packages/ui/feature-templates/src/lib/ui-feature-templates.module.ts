import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplatesDialogComponent } from './templates-dialog/templates-dialog.component';
import { TemplatesFiltersComponent } from './templates-dialog/templates-filters/templates-filters.component';
import { TemplateAppsDropdownComponent } from './templates-dialog/template-apps-dropdown/template-apps-dropdown.component';
import { TemplateAppTagContainerComponent } from './templates-dialog/template-apps-dropdown/template-app-tag-container/template-app-tag-container.component';
import { TemplateCardComponent } from './template-card/template-card.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { TemplatesContainerComponent } from './templates-container/templates-container.component';
import { TemplateBlogNotificationComponent } from './template-blog-notification/template-blog-notification.component';
import { NewFlowCardComponent } from './new-flow-card/new-flow-card.component';
const exportedDeclarations = [
  TemplatesDialogComponent,
  TemplatesFiltersComponent,
  TemplateAppsDropdownComponent,
  TemplateAppTagContainerComponent,
  TemplateCardComponent,
  TemplatesContainerComponent,
  TemplateBlogNotificationComponent,
  NewFlowCardComponent,
];
@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: exportedDeclarations,
  exports: exportedDeclarations,
})
export class UiFeatureTemplatesModule {}
