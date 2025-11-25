// Test for POST /careers/apply
// Run with: node routes/careers/apply/test.js
// Requires: AWS credentials, TABLE_NAME, FROM_EMAIL, TO_EMAIL env vars

import testLambda from './utilities/test-lambda.js'
import { handler } from './index.js'

var test = testLambda(handler)
console.log('\n=== Testing /careers/apply ===\n')


// Invalid Job
var invalidJob = {
  job: 'fake-job',
  name: 'John Doe',
  email: 'john@example.com',
  statement: 'I want to work here'
}
await test('Invalid job', invalidJob, 400)


// Invalid Email
var invalidEmail = {
  job: 'brand-manager',
  name: 'John Doe',
  email: 'john#noatsymbol.com',
  statement: 'I want to work here'
}
await test('Invalid email', invalidEmail, 400)


// Missing Statement
var missingStatement = {
  job: 'brand-manager',
  name: 'John Doe',
  email: 'john@example.com',
  statement: ''
}
await test('Missing statement', missingStatement, 400)


// Honeypot Spam
var spamSubmission = {
  job: 'brand-manager',
  name: 'Spam Bot',
  email: 'spam@spammer.com',
  statement: 'Buy our products!',
  website: 'http://spam-site.com'
}
await test('Honeypot spam detection', spamSubmission, 400)


// Valid Application
var validApplication = {
  job: 'brand-manager',
  name: 'Jane Smith',
  email: 'jane@example.com',
  linkedin: 'https://linkedin.com/in/janesmith',
  statement: 'I am passionate about carbon nanotubes and would love to help build the Troll Hair brand. I have 5 years of marketing experience in the materials science industry.'
}
var validNote = `
  📧 To: website@trollhair.com, Subject: "New Job Application: brand-manager from Jane Smith"
  💾 Table: devtrolls, pk: website#careers#application, sk: jane@example.com
`
await test('Valid application', validApplication, 200, validNote)


// Done
console.log('=== Tests completed ===\n')
