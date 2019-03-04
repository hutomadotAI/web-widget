import { Logger } from './logging.js';
import { format, linkify, sanitize } from './utils.js';


export class PropsError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PropsError';
  }
}

export class MessageTypeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MessageTypeError';
  }
}

export class Message {
  constructor(application) {
    this.logger = new Logger(this.constructor.name);
    this.logger.debug('Creating a new Message');

    if ('events' in this) {
      // Register message events
      this.logger.debug('Message events registred');
      application.events.push(this.events);
    }

    if ('styles' in this) {
      // Register message styles
      this.logger.debug('Message styles registred');
      application.addStyle(this.styles());
    }

    this.logger.debug('Message is ready');
  }
}

export class Element {
  render({ title, image_url, buttons,  subtitle = '' }) {
    return `
      <div class="element">
        <div class="body">
          ${ image_url ? (new Image).render({ imageUri: image_url }) : '' }
          <div class="title">${ sanitize(title.toString()) }</div>
          <div class="subtitle">${ sanitize(subtitle.toString()) }</div>
        </div>
        <div class="buttons">
          ${ buttons.map(button => (button.type === 'postback' ? new Button : new Link).render(button)).join('') }
        </div>
      </div>
    `;
  }
}

/**
 * Renders a button which clicked performs an action
 *
 * @param {string} [title]              Button text labale
 * @param {string} [postback]           Postback message that will be send back after the button is clicked
 * @param {string} [payload]            Postback message that will be send back after the button is clicked
 *
 * @return {string}                     Element HTML code as string.
 */
export class Button {
  render({ title, postback, payload, image_url = '' }) {
    let image = image_url ? `<img src="${ image_url }" height="32" width="32">` : '';
    return `<button class="button" data-postback="${ postback || title }" ${ payload ? `data-payload="${ payload }"` : '' }">${ image }${ sanitize(title.toString()) }</button>`;
  }
}



/**
 * Renders a simple text responses, takes as props text message
 *
 * @param {string} [text]               Element text
 *
 * @return {string}                     Element HTML code as string.
 */
export class Text {
  render({ text }) {
    if (!text) throw new PropsError('missing required props text');
    return `<div class="text">${ format(sanitize(text.toString())) }</div>`;
  }
}

/**
 * Renders a simple image responses, takes as props image URI and optional
 * alternative text
 *
 * @param {string} [imageUri]           URI of the image
 * @param {string} [alt]                (optional) Alternative text for the image
 *
 * @return {string}                     Element HTML code as string.
 */
export class Image {
  render({ imageUri, alt = '' }) {
    if (!imageUri) throw new PropsError('missing required props imageUri');
    return `<img src="${ imageUri }" alt="${ alt }">`;
  }
}

export class Link {
  render({ title, url }) {
    if (!title || !url) throw new PropsError('missing required props title or url');
    return `<a href="${ url }" class="button" target="_blank">${ sanitize(title.toString()) }</a>`;
  }
}


/**
 * Renders a button which clicked performs an action
 *
 * @param {string} [title]        Card title
 * @param {string} [imageUri]     URI of the card image
 * @param {string} [subtitle]     (optional) Subtitle of a card
 * @param {Object[]} [buttons]    (optional) Array of cards actions
 *
 * @return {string}               Element HTML code as string.
 */
export class Card {
  render({ title, imageUri, subtitle = '', buttons = [] }) {
    if (!title || !imageUri) throw new PropsError('missing required props title or imageUri');
    return `
      <div class="card">
        <div class="title">${ sanitize(title.toString()) }</div>
        <div class="subtitle">${ sanitize(subtitle.toString()) }</div>
        ${ (new Image).render({imageUri: imageUri}) }
        ${ buttons.map(button => (new Button).render(button)).join('') }
      </div>
    `;
  }
}

/**
 * Quick Replies
 *
 * Quick replies provide a way to present a set of up to 11 buttons
 * in-conversation that contain a title and optional image, and appear
 * prominently above the composer.
 *
 * You can also use quick replies to request a person’s location, email address,
 * and phone number.
 *
 * When a quick reply is tapped, the buttons are dismissed, and the title of the
 * tapped button is posted to the conversation as a message. A `messages` event
 * will be sent to your webhook that contains the button title and an optional
 * payload.
 *
 * Source: https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies
 *
 * @param {Object} [props]                 Elements properties that will be set
 * @param {Object[]} [props.quickReplies]  Array of actions
 * @param {string} [props.text]            (optional) Element text
 *
 * @return {string}                        Element HTML code as string.
 */
export class Quick_replies extends Message {
  render({ quick_replies, text = '' }) {
    const BUTTONS_LIMIT = 11;
    return `
      <div class="text">${ format(linkify(sanitize(text.toString()))) }</div>
      <div class="quickReplies">
        ${ quick_replies.slice(0, BUTTONS_LIMIT).map(reply => (new Button).render(reply)).join('') }
      </div>
    `;
  }
}

/**
 * Renders a set of buttons which clicked performs an action, can be rendered
 * with a optional title.
 *
 * @param {Object[]} [quickReplies]   Array of actions
 * @param {string} [title]            (optional) Element title
 *
 * @return {string}                   Element HTML code as string.
 */
export class List_template extends Message {
  render({ elements, buttons, top_element_style }) {
    return `
      <div class="list ${ top_element_style }">
        ${ elements.map(element => (new Element).render(element)).join('') }
      </div>
      <div class="buttons">
        ${ buttons.map(button => (button.type === 'postback' ? new Button : new Link).render(button)).join('') }
      </div>
    `;
  }
}

export class Button_template extends Message {
  render({ buttons, text = '' }) {
    return `
      <div class="text">${ format(linkify(sanitize(text.toString()))) }</div>
      <div class="buttons">
        ${ buttons.map(button => (button.type === 'postback' ? new Button : new Link).render(button)).join('') }
      </div>
    `;
  }
}

export class Generic_template extends Message {
  render({ elements }) {
    return `
      <div class="generic">
        ${ elements.map(element => (new Element).render(element)).join('') }
      </div>
    `;
  }
}
