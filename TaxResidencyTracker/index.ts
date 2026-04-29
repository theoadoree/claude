// IMPORTANT: BackgroundLocationTask must be imported FIRST — before registerRootComponent —
// so that TaskManager.defineTask() is called at module-load time, which is required
// by expo-task-manager for the background task to be recognized by the OS.
import './src/services/BackgroundLocationTask';

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
