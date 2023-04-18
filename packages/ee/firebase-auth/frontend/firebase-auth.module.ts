import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirebaseAuthLayoutRoutes } from './firebase-auth.routing';
import { FirebaseSignInComponent } from './sign-in/firebase-sign-in.component';
import { FirebaseAuthContainerComponent } from './auth-container/firebase-auth-container.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { FirebaseSignUpComponent } from './sign-up/firebase-sign-up.component';
import { FirebaseEmailVerificationComponent } from './email-verification/firebase-email-verification.component';
import { FirebaseForgotPasswordComponent } from './forgot-password/firebase-forgot-password.component';
import { environment, UiCommonModule} from '@activepieces/ui/common';

@NgModule({
	imports: [
		AngularFireModule.initializeApp(environment.firebase),
		AngularFireAuthModule,
		CommonModule,
		RouterModule.forChild(FirebaseAuthLayoutRoutes),
		FormsModule,
		ReactiveFormsModule,
		UiCommonModule
	],
	declarations: [FirebaseSignInComponent, FirebaseSignUpComponent, FirebaseAuthContainerComponent, FirebaseForgotPasswordComponent, FirebaseEmailVerificationComponent],
})
export class FirebaseAuthLayoutModule {}
