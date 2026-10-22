import {createRoot} from 'react-dom/client';
import { DemoProvider } from './demo';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <DemoProvider>
    <App />
  </DemoProvider>
);
