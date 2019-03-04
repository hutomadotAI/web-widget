import { Logger } from './logging.js';

export function translate(key) {
  if (!key) throw 'Translation key is empty.';
  return 'local' in window ? window.local.get(key) || key : key;
}

export class I18l {
  constructor(languageCode) {
    if (!languageCode) throw 'Language Code key is empty.';
    this.logger = new Logger(this.constructor.name);

    this.logger.debug(`Creating a ${ languageCode } internationalization`);

    return fetch(`./local/${ languageCode }.json`)
      .then(response => response.ok ? response : Promise.reject(response))
      .then(response => response.json())
      .then(local => window.local = new Map(Object.entries(local)))
      .catch(response => this.logger.warn(`No translation for “${ languageCode }” language, using keys`));
  }
}
