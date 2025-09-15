import './styles.css';
import { initRubiksApp } from './components/RubiksCube.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('main-content');
  initRubiksApp(container);
});
