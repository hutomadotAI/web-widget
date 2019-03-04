var test = require('tape');
var puppeteer = require('puppeteer');

const LOGGING_LEVELS = {
  'error': 40, 'warning': 30, 'dir': 20, 'dirxml': 20, 'table': 20, 'trace': 20,
  'clear': 20, 'startGroup': 20, 'startGroupCollapsed': 20, 'endGroup': 20,
  'assert': 20, 'profile': 20, 'profileEnd': 20, 'count': 20, 'timeEnd': 20,
  'log':  20, 'debug': 10
};
const LOG_LEVEL = process.env.LOG_LEVEL in LOGGING_LEVELS ? process.env.LOG_LEVEL : 'info';

const OPTIONS = {
  'ignoreHTTPSErrors': true, // Whether to ignore HTTPS errors during navigation.
  'executablePath': '/usr/bin/chromium-browser',
  'args': [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage' // By default, Docker runs a container with a
                              // /dev/shm shared memory space 64MB. This is
                              // typically too small for Chrome and will cause
                              // Chrome to crash when rendering large pages.
                              // To fix, run the container with docker run
                              // --shm-size=1gb to increase the size of /dev/shm.
                              // Since Chrome 65, this is no longer necessary.
                              // Instead, launch the browser with the
                              // --disable-dev-shm-usage flag
  ]
}

function loadScript() {
  document.head.appendChild(
    Object.assign(
      document.createElement('script'),
      {
        src: 'https://server/widget/widget.js',
        type: 'module'
      }
    )
  )
}

function setConfig(options) {
  window.hutoma = window.hutoma || [];

  // Boot bot
  hutoma.push(options);

  document.addEventListener('ai.hutoma.widget:loaded', e => console.log('Test: loaded'));
  document.addEventListener('ai.hutoma.widget:start', e => console.log('Test: start'));

  // Open the widget when it loads
  document.addEventListener('ai.hutoma.widget:start', e => document.getElementById('HUTOMA_WIDGET_BUTTON').click());

  // Attach initial message listener
  document.addEventListener('ai.hutoma.widget:show', postInitialMessage);

  function postInitialMessage() {
    // Send initial message
    hutoma.push(['post', 'Ciao.']);

    // Remove the listener
    document.removeEventListener('ai.hutoma.widget:show', postInitialMessage);
  }

  // Automate the conversation and save results in observed variable
  document.addEventListener('ai.hutoma.widget:sendCleanup', function sendCleanupHandle(event) {
    if (messages.length) {
      hutoma.push(['post', messages.shift()]);
    }
    window.results = event.properties
  });
}

test('Initial test', async function (t) {

  const browser = await puppeteer.launch(OPTIONS);

  t.plan(4);

  const page = await browser.newPage();

  page.on('pageerror', error => console.error(`Page error: ${ error.toString() }`));
  page.on('console', message => {
    if (LOGGING_LEVELS[message.type()] >= LOGGING_LEVELS[LOG_LEVEL] ) {
      switch(LOGGING_LEVELS[message.type()]) {
        case 10: console.log(message.text()); break;
        case 20: console.log(message.text()); break;
        case 30: console.warn(message.text()); break;
        case 40: console.error(message.text()); break;
      }
    }
  });

  await page.goto('https://server/test'); // Go to local page running in a container

  const pageTitle = await page.title(); // Get the title
  t.equal(pageTitle, 'Hu:toma web-widget: testing page', 'Test page should have a valid title');

  // Insert widget script
  await page.evaluate(loadScript);

  // Insert simple sequence
  await page.evaluate(() => {
    window.messages = [
      'Chiedi un prestito', 'accedi', 'do il consenso', 'do il consenso',
      'do il consenso', 'do il consenso', 'non essere', 'continua', '1000', '6',
      'continua', 'continua', 'hutoma', 'artificial intelligence', '333 123456',
      'test@hutoma.com', 'RTFHTM80A01F205M', 'celibe', 'italia', 'autonomo',
      'medico', '1000', 'di proprietà', 'villa', '700', '2010', 'si',
      'via bianchi 44', '20127', 'si', 'si', 'uno', 'uno', 'si'
    ];
  });

  // Set config
  await page.evaluate(setConfig, ['boot', 'agos-poc', 'it-IT']);

  await page.waitFor((final_message) => {
    return window.results && window.results.includes('La tua richiesta è in valutazione.\n')
  }, { timeout: 100000 })
    .then(result => result.jsonValue())
    .then(result => t.true(result, 'Simple sequence should reach the final message'))
    .catch(error => t.fail(error));

  // Reset the website
  await page.goto('https://server/test');

  // Insert widget script
  await page.evaluate(loadScript);

  // Insert normal sequence
  await page.evaluate(() => {
    window.messages = [
      'Chiedi un prestito', 'accedi', 'do il consenso', 'nego il consenso',
      'nego il consenso', 'nego il consenso', 'essere', 'leggi documentazione',
      'continua', '1234', '1000', 'altre opzioni', '12', 'si', 'continua',
      'hutoma', 'artificial intelligence', '333123456',
      'mario.rossi@hutoma.com', 'RTFHTM80A01F205M', 'single', 'sono italiano',
      'pensionato', 'invalido', 'pensione di invalidità', '1000', 'affitto',
      '500', 'ignora', '700', '01/2010', 'si', 'via bianchi 44', '20127', 'si',
      'si', '1', '1', 'no'
    ];
  });

  // Set config
  await page.evaluate(setConfig, ['boot', 'agos-poc', 'it-IT']);


  await page.waitFor((final_message) => {
    return window.results && window.results.includes('La tua richiesta è in valutazione.\n')
  }, { timeout: 100000 })
    .then(result => result.jsonValue())
    .then(result => t.true(result, 'Normal sequence should reach the final message'))
    .catch(error => t.fail(error));

  // Reset the website
  await page.goto('https://server/test');

  // Insert widget script
  await page.evaluate(loadScript);

  // Insert complex sequence
  await page.evaluate(() => {
    window.messages = [
      'Chiedi un prestito', 'accedi', 'do il consenso', 'do il consenso',
      'nego il consenso', 'do il consenso', 'essere', 'leggi documentazione',
      'continua con la chat', '2234', '2250', 'altre opzioni', 'avanti',
      'prosegui', '9', 'cambia importo', '500', '6', 'si', 'continua', 'hutoma',
      'artificial intelligence', '333123456', 'mario.rossi@hutoma.com',
      'RTFHTM80A01F205M', 'single', 'sono italiano', 'dipendente',
      'lista impieghi', 'medico', 'full time', '1000', '13', 'affitto', '500',
      'ignora', '700', '1 gennaio 2010', 'non lo so', 'via bianchi 44', '20127',
      'no', 'piazza rossi, 12', '20128', 'ignora', 'due', 'ignora', 'ignora'
    ];
  });

  // Set config
  await page.evaluate(setConfig, ['boot', 'agos-poc', 'it-IT']);


  await page.waitFor((final_message) => {
    return window.results && window.results.includes('La tua richiesta è in valutazione.\n')
  }, { timeout: 100000 })
    .then(result => result.jsonValue())
    .then(result => t.true(result, 'Complex sequence should reach the final message'))
    .catch(error => t.fail(error));

  await browser.close();

});
