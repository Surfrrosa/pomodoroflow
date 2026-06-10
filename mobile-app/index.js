import { registerRootComponent } from 'expo';

import App from './App';
import * as ErrorReporter from './services/ErrorReporter';

ErrorReporter.init();

registerRootComponent(ErrorReporter.wrap(App));
