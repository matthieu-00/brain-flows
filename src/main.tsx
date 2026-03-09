import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'prosemirror-view/style/prosemirror.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      title="Application error"
      description="The app hit an unexpected error. Reload the page to recover."
    >
      <App />
    </ErrorBoundary>
  </StrictMode>
);
