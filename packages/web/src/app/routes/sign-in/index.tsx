import { Navigate } from 'react-router-dom';

const SignInPage: React.FC = () => <Navigate to="/login" replace />;

SignInPage.displayName = 'SignInPage';

export { SignInPage };
