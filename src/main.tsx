import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import { App } from './App';
import { parks } from './data/parks';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App parks={parks} />
  </StrictMode>,
);
