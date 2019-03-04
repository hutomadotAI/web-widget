import { Logger } from './logging.js';


export class Recognizer {
  constructor(handleTranscript, handleRecognitionEnd, languageCode = 'en-US') {
    this.logger = new Logger(this.constructor.name);
    this.logger.debug('Creating a new Recognizer');

    if (!'webkitSpeechRecognition' in window) throw 'No Speech recognition in this browser';
    if (!isSecureContext) throw 'Context must be secured to use Speech recognition';

    this.busy = false;
    this.handleTranscript = handleTranscript;
    this.handleRecognitionEnd = handleRecognitionEnd;
    this.speechRecognition = new webkitSpeechRecognition;
    this.speechRecognition.lang = languageCode;

    this.speechRecognition.addEventListener('error', this.handleError.bind(this));
    this.speechRecognition.addEventListener('end', this.handleEnd.bind(this));
    this.speechRecognition.addEventListener('result', this.handleResult.bind(this));
    this.speechRecognition.addEventListener('start', this.handleStart.bind(this));

  }

  start() {
    this.logger.debug('Starting voice recognition');
    this.speechRecognition.start();
  }

  stop() {
    this.logger.debug('Stoping voice recognition');
    this.speechRecognition.stop();
  }

  handleStart(event) {
    this.logger.debug('Voice recognition has started');
    this.busy = true;
  }

  handleError(event) {
    this.logger.error(event.error);
  }

  handleEnd(event) {
    this.logger.debug('Voice recognition has finish');
    this.handleRecognitionEnd();
    this.busy = false;
  }

  handleResult(event) {
    this.logger.debug('Handling voice recognition results');
    // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
    // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
    // It has a getter so it can be accessed like an array
    // The first [0] returns the SpeechRecognitionResult at position 0.
    // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
    // These also have getters so they can be accessed like arrays.
    // The second [0] returns the SpeechRecognitionAlternative at position 0.
    // We then return the transcript property of the SpeechRecognitionAlternative object
    let transcript = event.results[0][0].transcript;

    this.logger.debug(`Transcript: ${ transcript }`);
    this.handleTranscript(transcript);
  }
}
