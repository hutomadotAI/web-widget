export class Logger {
  constructor(name) {
    if (!name) throw 'Logger need to have a name';
    this.name = name;
  }

  debug(message) {
    console.debug(this.format(message));
  }

  error(message) {
    console.error(this.format(message));
  }

  format(message) {
    return `${ this.name }: ${ message }`;
  }

  info(message) {
    console.info(this.format(message));
  }

  warn(message) {
    console.warn(this.format(message));
  }
}
