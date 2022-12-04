import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth-layout.routing';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { CommonLayoutModule } from '../common-layout/common-layout.module';
import { MatTabsModule } from '@angular/material/tabs';
import { NgSelectModule } from '@ng-select/ng-select';
import { AuthLayoutComponent } from './auth-layout.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(AuthLayoutRoutes),
		FormsModule,
		ReactiveFormsModule,
		CommonLayoutModule,
		MatTabsModule,
		NgSelectModule,
	],
	declarations: [AuthLayoutComponent, SignInComponent],
})
export class AuthLayoutModule {}
