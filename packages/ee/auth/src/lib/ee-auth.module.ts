import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirebaseAuthLayoutRoutes } from './ee-auth.routing';
import { FirebaseSignInComponent } from './sign-in/firebase-sign-in.component';
import { FirebaseAuthContainerComponent } from './auth-container/firebase-auth-container.component';
import { FirebaseSignUpComponent } from './sign-up/firebase-sign-up.component';
import { FirebaseEmailVerificationComponent } from './email-verification/firebase-email-verification.component';
import { FirebaseForgotPasswordComponent } from './forgot-password/firebase-forgot-password.component';
import { UiCommonModule} from '@activepieces/ui/common';
import { FirebaseAuthActionComponent } from './auth-action/firebase-auth-action.component';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(FirebaseAuthLayoutRoutes),
		FormsModule,
		ReactiveFormsModule,
		UiCommonModule
	],
	declarations: [FirebaseSignInComponent, FirebaseSignUpComponent, FirebaseAuthContainerComponent, FirebaseForgotPasswordComponent, FirebaseEmailVerificationComponent, FirebaseAuthActionComponent],
})
export class FirebaseAuthLayoutModule {}
