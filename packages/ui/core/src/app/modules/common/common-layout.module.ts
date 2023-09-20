import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { MatExpansionModule } from '@angular/material/expansion';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { StoreModule } from '@ngrx/store';
import { AngularSvgIconModule } from 'angular-svg-icon';
import {
  MatTooltipDefaultOptions,
  MatTooltipModule,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
} from '@angular/material/tooltip';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import {
  MatSnackBarModule,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
} from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import {
  MatFormFieldModule,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { QuillModule } from 'ngx-quill';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTreeModule } from '@angular/material/tree';
import { ImgFallbackDirective } from './helper/image-fallback.directive';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  ProjectEffects,
  UiCommonModule,
  projectReducer,
} from '@activepieces/ui/common';
import { EffectsModule } from '@ngrx/effects';

export const materialTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 0,
  hideDelay: 0,
  touchendHideDelay: 0,
};

@NgModule({
  declarations: [ImgFallbackDirective],
  imports: [
    FontAwesomeModule,
    CommonModule,
    ReactiveFormsModule,
    NgxSkeletonLoaderModule,
    MatExpansionModule,
    MatTabsModule,
    CodemirrorModule,
    FormsModule,
    MatMenuModule,
    UiCommonModule,
    QuillModule.forRoot({}),
    EffectsModule.forFeature([ProjectEffects]),
    StoreModule.forFeature('commonState', {
      projectsState: projectReducer,
    }),
    AngularSvgIconModule,
    MatTooltipModule,
    MonacoEditorModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatSelectModule,
    MatTableModule,
    MatDialogModule,
    MatToolbarModule,
    MatIconModule,
    MatDividerModule,
    MatTreeModule,
    MatButtonToggleModule,
  ],
  exports: [
    AngularSvgIconModule,
    FontAwesomeModule,
    MatSnackBarModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatSidenavModule,
    MatSelectModule,
    MatTableModule,
    MatDialogModule,
    MatToolbarModule,
    MatIconModule,
    ImgFallbackDirective,
    MatDividerModule,
    MatButtonToggleModule,
    MatTabsModule,
  ],
  providers: [
    {
      provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
      useValue: { duration: 3000, panelClass: 'ap-text-center' },
    },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: materialTooltipDefaults },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'always' },
    },
  ],
})
export class MaterialLayoutModule {}
