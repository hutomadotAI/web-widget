import * as config from './config.env.js';
import { Logger } from './logging.js';

let logger = new Logger('error_reporter');

if (config.STACKDRIVER_API_KEY) {
  window.addEventListener('DOMContentLoaded', function HandleDOMContentLoaded() {
    logger.debug('Starting error reporter');
    let error_handler = new window.StackdriverErrorReporter();

    error_handler.start({
      key: config.STACKDRIVER_API_KEY,
      projectId: 'web-widget-poc',
      service: config.SERVICE,
      version: config.TAG_NAME || config.SHORT_SHA
    });
  });
} else {
  logger.info('No error reporting');
}
