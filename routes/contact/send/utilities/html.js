// Pure: tagged template literal for syntax highlighting
// Pass-through that combines strings and values

export default function html (strings, ...values) {
  return strings.reduce((result, str, i) => result + str + (values[i] || ''), '')
}
