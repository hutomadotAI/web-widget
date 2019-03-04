import { Adapter } from './adapter.js';


export class LegacyAdapter extends Adapter {
  constructor(application) {
    super(application);

    this.endpoint = `https://europe-west1-web-widget-poc.cloudfunctions.net/detectIntent?projectId=${ application.bot }&sessionId=${ this.sessionID }`;
  }

  send(query, payload, languageCode = 'en-US') {
    this.logger.debug(`Sending “${ query }” to the bot with language code “${ languageCode }”`);
    // Prepare payload that would be send
    let data = {
      query: payload || query,
      languageCode: languageCode,
      queryParams: {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        payload: {
          source: 'hutoma',
          sender: {
            id: this.sessionID
          }
        }
      }
    };

    return fetch(this.endpoint, {
      method: 'POST',
      mode: 'cors',
      body: JSON.stringify(data),
      headers:{
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.ok ? response : Promise.reject(response))
      .then(response => response.json())
      .then(
        responseJSON => responseJSON.queryResult.fulfillmentMessages
          // Normalize standar and Facebook messages
          .map(message => message.facebook || message)
          // Fix over encaspulation in text messages
          .map(message => typeof message.text == 'object' && 'text' in message.text ? message.text : message)
          .map(this.prepareMessages.bind(this)),
        this.returnErrorMessage
      );
  }

}
