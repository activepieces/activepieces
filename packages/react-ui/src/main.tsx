import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

// Import global styles
import './styles.css';
import './i18n';

// Import the App component
import App from './App';

// Create root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

// Create and render the root
const root = ReactDOM.createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
