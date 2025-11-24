// Shared test utility for Lambda integration tests
// Simple helper that formats event, calls handler, displays result

export default function testLambda (handler) {
  return async function (name, data, expectedStatus, note = '') {
    var response = await handler({ body: JSON.stringify(data) })
    var pass = response.statusCode === expectedStatus
    console.log(`${pass ? '✓' : '✗'} ${name}`)
    console.log(`  → ${response.statusCode} ${response.body}`)
    if (note) console.log(`  ${note}`)
    console.log('')
  }
}
