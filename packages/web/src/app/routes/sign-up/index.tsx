import { Navigate, useLocation } from 'react-router-dom';

const SignUpPage: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/sign-in${location.search}`} replace />;
};

SignUpPage.displayName = 'SignUpPage';

export { SignUpPage };
