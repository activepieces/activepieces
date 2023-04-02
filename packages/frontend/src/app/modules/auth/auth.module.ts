import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthLayoutRoutes } from './auth.routing';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { AuthLayoutComponent } from './auth.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { UiCommonModule } from '@/ui/common/src';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(AuthLayoutRoutes),
    FormsModule,
    ReactiveFormsModule,
    CommonLayoutModule,
    UiCommonModule,
  ],
  declarations: [AuthLayoutComponent, SignInComponent, SignUpComponent],
})
export class AuthLayoutModule {}
