export function sanitize(string) {
  return string.replace(/[\x26\x0A\<>'"]/g, char => `&#${ char.charCodeAt(0) };`);
}

export function guid() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export function linkify(string) {

  // http://, https://, ftp://
  let urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

  // www. sans http:// or https://
  let pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

  // Email addresses
  let emailAddressPattern = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;

  return string
    .replace(urlPattern, '<a target="_blank" href="$&">$&</a>')
    .replace(pseudoUrlPattern, '$1<a target="_blank" href="https://$2">$2</a>')
    .replace(emailAddressPattern, '<a target="_blank" href="mailto:$1">$1</a>');
}

export function format(string) {

  let boldPattern = /\*(.*?)\*/g;
  let italicPattern = /_(.*?)_/g;
  let strikethroughPattern = /~(.*?)~/g;
  let monospacePattern = /`(.*?)`/g;

  return string
    .replace(boldPattern, '<b>$1</b>')
    .replace(italicPattern, '<i>$1</i>')
    .replace(strikethroughPattern, '<strike>$1</strike>')
    .replace(monospacePattern, '<code>$1</code>');
}
