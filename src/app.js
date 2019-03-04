import { Logger } from './logging.js';
import { Text, Image, Card, Quick_replies, Button_template, List_template, Generic_template } from './messages.js';
import { Recognizer } from './recognizer.js';
import { LegacyAdapter } from './legacy.adapter.js';
import { HutomaAdapter } from './hutoma.adapter.js';
import { guid } from './utils.js';
import { I18l, translate } from './i18l.js';


const FORM = document.getElementById('FORM');
const MESSAGES = document.getElementById('MESSAGES');
const MIC = document.getElementById('MIC');
const CLOSE = document.getElementById('CLOSE');
const INPUT = document.getElementById('INPUT');
const MESSAGE_CLASS = 'message';
const DEFAULT_LANGUAGE_CODE = 'en-US';

class App {

  constructor() {
    this.logger = new Logger(this.constructor.name);
    this.logger.debug('Creating a new App');
    this.busy = false;
    this.sessionId = guid();

    // Attach our message listener
    window.addEventListener('message', this.handleMessage.bind(this));

    // Set error handling
    if ('errorHandler' in window) {
      errorHandler.setUser(this.sessionId);
    }
  }

  boot(host, bot, { languageCode = DEFAULT_LANGUAGE_CODE, token = '' }) {
    if (!host || !bot) throw new Error('You need to send a Host and a Bot to boot');
    this.logger.debug(`Booting new app for bot “${ bot }” using language “${ languageCode }”`);
    this.host = host;
    this.bot = bot;
    this.token = token;

    // Set i18l and set localized strings
    document.documentElement.lang = this.languageCode = languageCode;
    new I18l(document.documentElement.lang)
      .then(local => INPUT.placeholder = translate('Ask something…'));

    // Set HTML
    FORM.addEventListener('submit', this.handleSubmit.bind(this));
    MESSAGES.addEventListener('click', this.handlePostback.bind(this));
    MESSAGES.addEventListener('click', this.handleScroll.bind(this));
    CLOSE.addEventListener('click', this.handleCloseClick.bind(this));

    // Set style
    this.style = document.createElement('style');
    document.head.appendChild(this.style);

    this.messages = {
      text: new Text(this),
      image: new Image(this),
      card: new Card(this),
      quick_replies: new Quick_replies(this),
      button: new Button_template(this),
      list: new List_template(this),
      generic: new Generic_template(this)
    };

    this.adapter = this.token ? new HutomaAdapter(this) : new LegacyAdapter(this);
    this.logger.debug('Adapter is set');

    try {
      this.recognizer = new Recognizer(
        this.handleTranscript.bind(this),
        this.handleRecognitionEnd.bind(this),
        this.languageCode
      );
      MIC.addEventListener('click', this.handleMicClick.bind(this));
      MIC.disabled = false;
      this.logger.debug('Recognizer is set');
    } catch(error) {
      this.logger.warn(error);
      this.logger.warn('Recognizer wasn’t set');
    }

    this.postMessage('start');
  }

  addStyle(rules) {
    this.logger.debug(`Add style: ${ rules }`);

    rules.forEach(rule => this.style.sheet.insertRule(rule));
  }

  handleMessage(event) {
    let [command, ...payload] = event.data;
    switch(command) {
    case 'boot':
      // Handling first boot syntax without Options as an object
      if (payload[1] && typeof payload[1] === 'string') {
        payload[1] = { languageCode: payload[1] };
      }
      this.boot(event.source, ...payload);
      break;
    case 'post':
      this.sendQuery(...payload);
      break;
    }
  }

  handlePostback(event) {
    let { postback, payload = false } = event.target.dataset;
    if (postback) {
      this.sendQuery(postback, payload );
    }
  }

  handleScroll(event) {
    let { target } = event.target.dataset;
    if (target) {
      event.target.parentElement.querySelector('.generic').scrollBy(256, 0);
    }
  }

  handleCloseClick() {
    this.postMessage('hide');
  }

  handleMicClick() {
    MIC.classList.add('active');
    this.recognizer.busy ? this.recognizer.stop() : this.recognizer.start();
  }

  handleRecognitionEnd() {
    MIC.classList.remove('active');
  }

  handleTranscript(transcript) {
    this.sendQuery(transcript);
  }

  handleSubmit(event) {
    this.logger.debug('Form was submitted');
    event.preventDefault();
    let form = new FormData(event.target);
    let query = form.get('query');
    this.sendQuery(query);
  }

  postMessage(command, properties = []) {
    if (!this.host) throw 'No host found, can’t send messages';
    this.host.postMessage([command, ...properties], '*');
  }

  sendQuery(query, payload) {
    this.logger.debug(`Sending message: query: ${ query }, payload: ${ payload }`);

    MESSAGES.classList.add('loading');

    this.appendMessages(
      this.renderMessages([{
        author: 'me',
        type: 'text',
        content: {
          text: query
        }
      }]));

    this.adapter.send(query, payload, this.languageCode)
      .then(this.renderMessages.bind(this))
      .then(this.appendMessages.bind(this))
      .catch(error => console.error(error))
      .then(this.sendCleanup.bind(this));
  }

  sendCleanup(messages) {
    MESSAGES.classList.remove('loading');
    FORM.reset();

    // Send Cleanup event and attach responses for automation and testing
    this.postMessage('sendCleanup', messages.map(message => message.innerText));
  }

  appendMessages(messages) {
    messages.forEach(message => MESSAGES.appendChild(message));
    MESSAGES.scrollTop = MESSAGES.scrollHeight;
    return messages;
  }

  renderMessages(messages) {
    return messages.filter(message => message.type in this.messages)
      .map(message => {
        try {
          return Object.assign(document.createElement('div'), {
            className: [MESSAGE_CLASS, message.author].join(' '),
            innerHTML: this.messages[message.type].render(message.content)
          });
        } catch (error) {
          this.logger.error(error);
          return null;
        }
      })
      .filter(message => message);
  }

}

new I18l(DEFAULT_LANGUAGE_CODE);
new App();
