import { Logger } from './logging.js';
import { HUTOMA_ORIGIN, WIDGET_IFRAME_URL } from './config.env.js';

const EVENT_PREFIX = 'ai.hutoma.widget';
const WIDGET_IFRAME_ID = 'HUTOMA_WIDGET';
const WIDGET_BUTTON_ID = 'HUTOMA_WIDGET_BUTTON';

const WIDGET_IFRAME_STYLE = `
  border: none;
  box-shadow: -8px 0 0 0 rgba(0,0,0,0.2);
  display: block;
  height: 100% !important;
  width: 100vw !important;
  position: fixed;
  top: auto;
  left: auto;
  bottom: 0;
  right: -388px;
  visibility: visible;
  z-index: 2147483647;
  max-height: 100vh;
  max-width: 380px;
  min-width: 320px;
  transition: right 480ms ease-in-out;
  background: none transparent;
  opacity: 1;
`;

const WIDGET_BUTTON_STYLE = `
  outline: none !important;
  border: none;
  color: transparent;
  border-radius: 16px;
  height: 64px !important;
  width: 64px !important;
  position: fixed;
  top: auto;
  left: auto;
  bottom: 24px;
  right: 24px;
  visibility: visible;
  z-index: -1;
  max-height: 64px;
  max-width: 64px;
  transition: opacity 480ms ease-in-out;
  background: url('https://widget.hutoma.ai/hu.svg') #2196f3;
  opacity: 0;
`;

// Iframe Permissions
// Source: https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-permissions-in-cross-origin-iframes
const WIDGET_IFRAME_PERMISSIONS = 'microphone';

class WidgetError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WidgetError';
  }
}

class Widget {
  constructor(commands = []) {
    this.logger = new Logger(this.constructor.name);

    this.logger.debug('Creating a new Hu:toma widget');

    // Check if iframe exist or create a new one
    this.iframe = document.getElementById(WIDGET_IFRAME_ID) || document.createElement('iframe');

    // Attach our message listener
    window.addEventListener('message', this.handleMessage.bind(this));

    // Set iframe
    this.iframe.id = WIDGET_IFRAME_ID;
    this.iframe.style = WIDGET_IFRAME_STYLE;
    this.iframe.src = WIDGET_IFRAME_URL;
    this.iframe.allow = WIDGET_IFRAME_PERMISSIONS;
    this.iframe.loaded = false;
    this.iframe.addEventListener('load', event => this.iframe.loaded = true);

    document.body.appendChild(this.iframe);

    this.logger.debug('Iframe set');

    // Set show button
    this.button = document.getElementById(WIDGET_BUTTON_ID) || document.createElement('button');
    this.button.id = WIDGET_BUTTON_ID;
    this.button.style = WIDGET_BUTTON_STYLE;
    this.button.innerText = 'show';
    this.button.addEventListener('click', this.handleButtonClick.bind(this));

    document.body.appendChild(this.button);

    this.logger.debug('Button set');

    // Take care of initial commands
    this.commands = new Proxy([], {set: this.push.bind(this)});
    commands.forEach(command => this.commands.push(command));
    this.logger.debug('Initial commands enqueued');

    this.commands.button = this.button;

    this.dispatchEvent('loaded');
    return this.commands;
  }

  handleMessage(event) {
    if (event.origin === HUTOMA_ORIGIN) {
      this.logger.debug(`Getting message “${ event.data }” from iframe`);
      this.commands.push(event.data);
    }
  }

  push(target, property, value) {
    if (Array.isArray(value)) {
      let [command, ...properties] = value;
      // Call command dispatcher
      this.dispacher(command, properties);
    }

    target[property] = value;

    // You have to return true to accept the changes
    return true;
  }

  dispacher(command, properties) {
    this.logger.debug(`Dispatching command “${ command }” with properties: ${ properties }`);
    if (this.iframe.loaded) { // If loaded postMessage
      switch(command) {
      case 'start': this.showButton(); break;
      case 'show': this.showWidget(); break;
      case 'hide': this.hideWidget(); break;
      }
      this.postMessage(command, properties);
    } else { // if not add as self removing event on load
      this.iframe.addEventListener('load', event => {
        this.postMessage(command, properties);
      });
    }
  }

  dispatchEvent(event_type, properties = {}) {
    let event = new Event(`${ EVENT_PREFIX }:${ event_type }`, { bubbles: true });
    event.properties = properties;
    this.iframe.dispatchEvent(event);
  }

  postMessage(command, properties = []) {
    if (!this.iframe.loaded) throw new WidgetError('Iframe needs to be loaded to post a command');
    this.iframe.contentWindow.postMessage([command, ...properties], '*');
    this.dispatchEvent(command, properties);
  }

  handleButtonClick() {
    this.commands.push(['show']);
  }

  showButton() {
    this.logger.debug('Showing button');
    this.button.style.opacity ='1';
    this.button.style.zIndex ='2147483647';
  }

  showWidget() {
    this.logger.debug('Showing iframe');
    this.iframe.style.right ='0';
    this.button.style.opacity ='0';
    this.button.style.zIndex ='-1';
  }

  hideWidget() {
    this.logger.debug('Hiding iframe');
    this.iframe.style.right ='-388px';
    this.button.style.opacity ='1';
    this.button.style.zIndex ='2147483646';
  }
}

window.hutoma = new Widget(window.hutoma);
