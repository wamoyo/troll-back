// Honeypot spam detection utility
// Checks if honeypot field is filled and logs spam attempts with intelligence

export function isSpam (honeypotValue, event) {
  if (honeypotValue) {
    var ip = event?.requestContext?.http?.sourceIp || 'unknown'
    var userAgent = event?.headers?.['user-agent'] || 'unknown'

    console.log('🚫 Spam blocked:', JSON.stringify({
      ip,
      userAgent,
      timestamp: new Date().toISOString(),
      data: JSON.parse(event.body)
    }, null, 2))

    return true
  }
  return false
}
