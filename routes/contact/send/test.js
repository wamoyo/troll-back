// Test for POST /contact/send
// Run with: node routes/contact/send/test.js
// Requires: AWS credentials, TABLE_NAME, FROM_EMAIL, TO_EMAIL env vars

import testLambda from '../../../utilities/test-lambda.js'
import { handler } from './index.js'

var test = testLambda(handler)
console.log('\n=== Testing /contact/send ===\n')


// Invalid Email
var invalidEmail = {
  name: 'John Doe',
  email: 'john#noatsymbol.com',
  message: 'This should fail validation'
}
await test('Invalid email', invalidEmail, 400)


// Honeypot Spam
var spamSubmission = {
  name: 'Spam Bot',
  email: 'spam@spammer.com',
  message: 'Buy our products!',
  website: 'http://spam-site.com'
}
await test('Honeypot spam detection', spamSubmission, 400)


// Valid Email
var validEmail = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '555-1234',
  message: 'I would like to learn more about your CNT products.'
}
var validEmailNote = `
  📧 To: website@trollhair.com, Subject: "New Contact Form Submission from Jane Smith"
  💾 Table: devtrolls, pk: website-contact#<timestamp>, sk: jane@example.com
`
await test('Valid submission', validEmail, 200, validEmailNote)


// Done
console.log('=== Tests completed ===\n')
