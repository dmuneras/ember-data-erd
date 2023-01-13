/**
 * Camelize a string, cutting the string by multiple separators like
 * hyphens, underscores and spaces.
 * Taken from: https://ourcodeworld.com/articles/read/608/how-to-camelize-and-decamelize-strings-in-javascript
 *
 * @param {text} string Text to camelize
 * @return string Camelized text
 */
const camelize = function (text) {
  return text.replace(/^([A-Z])|[\s-_]+(\w)/g, function (_match, p1, p2) {
    if (p2) return p2.toUpperCase();
    return p1.toLowerCase();
  });
};

export default {
  camelize,
};
