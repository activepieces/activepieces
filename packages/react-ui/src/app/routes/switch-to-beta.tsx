import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SwitchToBetaPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const switchToBeta = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      const currentUser = searchParams.get('currentUser');

      if (token && currentUser) {
        // Save token and currentUser to localStorage
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('currentUser', currentUser);

        // Redirect to the root URL
        navigate('/');
      } else {
        console.error('Token or currentUser is missing.');
      }
    };
    switchToBeta();
  }, [navigate]);

  return <div></div>;
};

export { SwitchToBetaPage };
