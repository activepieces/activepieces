import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditableTextComponent } from './components/editable-text/editable-text.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconButtonComponent } from './components/icon-button/icon-button.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { HighlightService } from './service/highlight.service';
import { StateIconComponent } from './components/status-icon/state-icon.component';
import { JsonViewComponent } from './components/json-view/json-view.component';
import { ApPaginatorComponent } from './components/pagination/ap-paginator.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApButtonComponent } from './components/ap-button/ap-button.component';
import { ApImgComponent } from './components/ap-img/ap-img.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { LoadingSkeletonComponent } from './components/loading-skeleton/loading-skeleton.component';
import { ApInputComponent } from './components/ap-input/ap-input.component';
import { LoadingIconComponent } from './components/loading-icon/loading-icon.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { DefaultFalsePipe } from './pipe/default-false.pipe';
import { DefaultTruePipe } from './pipe/default-true.pipe';
import { OutputLogPipe } from './pipe/output-log';
import { DefaultZeroPipe } from './pipe/default-zero.pipe';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { StoreModule } from '@ngrx/store';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatTooltipDefaultOptions, MatTooltipModule, MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { RawOutputLogPipe } from './pipe/raw-output-log';
import { MatSnackBarModule, MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import { CheckboxComponent } from './components/app-checkbox/checkbox.component';
import { LongTextFormControlComponent } from './components/form-controls/long-text-form-control/long-text-form-control.component';
import { DictionaryFormControlComponent } from './components/form-controls/dictionary-form-control/dictionary-form-control.component';
import { OAuth2ConnectControlComponent } from './components/form-controls/o-auth2-connect-control/o-auth2-connect-control.component';
import { ConfigsFormComponent } from './components/configs-form/configs-form.component';
import { CodeArtifactFormControlComponent } from './components/form-controls/code-artifact-form-control/code-artifact-form-control.component';
import { CodeArtifactControlFullscreenComponent } from './components/form-controls/code-artifact-form-control/code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { TestCodeFormModalComponent } from './components/form-controls/code-artifact-form-control/code-artifact-control-fullscreen/test-code-form-modal/test-code-form-modal.component';
import { AddNpmPackageModalComponent } from './components/form-controls/code-artifact-form-control/code-artifact-control-fullscreen/add-npm-package-modal/add-npm-package-modal.component';
import { projectReducer } from './store/reducer/project.reducer';
import { TrackHoverDirective } from './components/form-controls/dictionary-form-control/track-hover.directive';
import { RequestTypeTemplateComponent } from './components/form-controls/request-type-template/request-type-template.component';
import { EndpointFormControlComponent } from './components/form-controls/endpoint-form-control/endpoint-form-control.component';
import { ConnectorCustomRequestFormControlComponent } from './components/form-controls/connector-custom-request-form-control/connector-custom-request-form-control.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { DialogTitleTemplateComponent } from './components/dialog-title-template/dialog-title-template.component';
import { MatDialogModule } from '@angular/material/dialog';
import { JsonViewDialogComponent } from './components/json-view/json-view-dialog/json-view-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
export const materialTooltipDefaults: MatTooltipDefaultOptions = {
	showDelay: 0,
	hideDelay: 0,
	touchendHideDelay: 0,
};

@NgModule({
	declarations: [
		EditableTextComponent,
		IconButtonComponent,
		StateIconComponent,
		JsonViewComponent,
		ApPaginatorComponent,
		ApButtonComponent,
		ApImgComponent,
		LoadingSkeletonComponent,
		ApInputComponent,
		LoadingIconComponent,
		DefaultFalsePipe,
		DefaultTruePipe,
		OutputLogPipe,
		RawOutputLogPipe,
		DefaultZeroPipe,
		JsonViewComponent,
		LongTextFormControlComponent,
		CheckboxComponent,
		DictionaryFormControlComponent,
		OAuth2ConnectControlComponent,
		ConfigsFormComponent,
		CodeArtifactFormControlComponent,
		CodeArtifactControlFullscreenComponent,
		TestCodeFormModalComponent,
		AddNpmPackageModalComponent,
		TrackHoverDirective,
		RequestTypeTemplateComponent,
		EndpointFormControlComponent,
		ConnectorCustomRequestFormControlComponent,
		DialogTitleTemplateComponent,
		JsonViewDialogComponent,
	],
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
	],
	exports: [
		EditableTextComponent,
		IconButtonComponent,
		StateIconComponent,
		JsonViewComponent,
		ApPaginatorComponent,
		ApButtonComponent,
		ApImgComponent,
		LoadingSkeletonComponent,
		ApInputComponent,
		LoadingIconComponent,
		DefaultFalsePipe,
		DefaultTruePipe,
		DefaultZeroPipe,
		AngularSvgIconModule,
		FontAwesomeModule,
		MatSnackBarModule,
		MatButtonModule,
		LongTextFormControlComponent,
		CheckboxComponent,
		OAuth2ConnectControlComponent,
		DictionaryFormControlComponent,
		ConfigsFormComponent,
		CodeArtifactFormControlComponent,
		MatTooltipModule,
		MatSlideToggleModule,
		EndpointFormControlComponent,
		ConnectorCustomRequestFormControlComponent,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatMenuModule,
		MatCheckboxModule,
		MatSidenavModule,
		MatSelectModule,
		MatTableModule,
		DialogTitleTemplateComponent,
		MatDialogModule,
	],
	providers: [
		HighlightService,
		{ provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000, panelClass: 'ap-text-center' } },
		{ provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: materialTooltipDefaults },
		{
			provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
			useValue: { appearance: 'outline' },
		},
	],
})
export class CommonLayoutModule {}
