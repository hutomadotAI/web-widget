import { Logger } from './logging.js';
import { translate } from './i18l.js';
import { MessageTypeError } from './messages.js';


export class Adapter {
  constructor(application) {
    if (!application) throw 'Need to be called for an application';
    this.logger = new Logger(this.constructor.name);
    this.logger.debug('Creating a new Adapter');
    this.sessionID = application.sessionId;
    this.types = Object.keys(application.messages);
    this.default_error_message = translate(
      'Sorry, it seemed like there was an error during request.'
    );
  }

  prepareMessages(message) {
    let type, content;

    if ('attachment' in message && message.attachment.type === 'template') {
      type = message.attachment.payload.template_type;
      if (!this.types.includes(type)) throw new MessageTypeError('Unknown message type');
      content = message.attachment.payload;
    }

    if ('quick_replies' in message) {
      type = 'quick_replies';
      content = message;
    } else if ('text' in message) {
      type = 'text';
      content = message;
    }

    if (!type) throw new MessageTypeError('Unknown message type');
    if (!content) throw new MessageTypeError('Message content is missing');

    this.logger.debug(`Message “${ type }” is ready`);

    return {
      author: 'bot',
      type: type,
      content: content
    };
  }

  returnErrorMessage(errorJSON) {
    this.logger.error(errorJSON);

    return [{
      author: 'error',
      type: 'text',
      content: { text: this.default_error_message }
    }];
  }

  send(query, payload, languageCode = 'en-US') {
    throw 'Send method need to be implemented by child class';
  }

}
