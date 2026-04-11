import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'



try {
  const rootElement = document.getElementById('root');
  console.log('Root element found:', rootElement);
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    console.log('React finished rendering (mount triggered)');
  } else {
    console.error('Root element not found!');
    document.body.innerHTML += '<h1 style="color: red;">ROOT ELEMENT MISSING!</h1>';
  }
} catch (e: any) {
  console.error('Crash during initial mount:', e);
  document.body.innerHTML += '<h1 style="color: red;">CRASH DURING MOUNT: ' + e.message + '</h1>';
}
