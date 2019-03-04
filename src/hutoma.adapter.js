import { Adapter } from './adapter.js';


export class HutomaAdapter extends Adapter {
  constructor(application) {
    super(application);

    this.token = application.token;
    this.endpoint = `https://api.hutoma.ai/v1/ai/${ application.bot }/chat?&sessionId=${ this.sessionID }`;
  }

  getMessages(result) {
    if (!('answer' in result)) throw 'Answer is missing';
    if ('rich_answer' in result && Object.keys(result.rich_answer).length) {
      return result.rich_answer.facebook_multi || [ result.rich_answer.facebook ];
    } else {
      return [{
        text: result.answer
      }];
    }
  }

  send(query, payload, languageCode = 'en-US') {
    this.logger.debug(`Sending “${ query }” to the bot with language code “${ languageCode }”`);

    return fetch(this.endpoint + '&q=' + (payload || query), {
      method: 'GET',
      mode: 'cors',
      headers:{
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ this.token }`
      }
    })
      .then(response => response.ok ? response : Promise.reject(response))
      .then(response => response.json())
      .then(
        responseJSON => this.getMessages(responseJSON.result).map(this.prepareMessages.bind(this)),
        this.returnErrorMessage
      );
  }

}
