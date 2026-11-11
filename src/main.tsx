import { createRoot } from 'react-dom/client';
import DemoApp from './demo/DemoApp.js';
import './demo/demo.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<DemoApp />);
}
