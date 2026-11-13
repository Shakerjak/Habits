// Kleine Hilfsfunktionen zum sicheren Erzeugen von HTML.
// Alle Werte in html`…` werden automatisch maskiert, außer sie stammen aus raw() oder html`…`.

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function raw(value) {
  return new SafeHtml(String(value ?? ''));
}

function render(value) {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(render).join('');
  return esc(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new SafeHtml(out);
}

// Attribute nur ausgeben, wenn ein Wert vorhanden ist: attr('href', url)
export function attr(name, value) {
  if (value === null || value === undefined || value === false) return raw('');
  if (value === true) return raw(` ${name}`);
  return raw(` ${name}="${esc(value)}"`);
}
