// Lambda handler for POST /careers/apply
// Receives job application, saves to DynamoDB, sends email via SES

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createEmailBody } from './application.email.js'
import { isSpam } from './utilities/honeypot.js'

var dynamoClient = new DynamoDBClient({})
var docClient = DynamoDBDocumentClient.from(dynamoClient)
var sesClient = new SESClient({})

var TABLE_NAME = process.env.TROLLHAIR_TABLE_NAME
var FROM_EMAIL = process.env.TROLLHAIR_FROM_EMAIL
var TO_EMAIL = process.env.TROLLHAIR_TO_EMAIL

// Valid job IDs
var validJobs = [
  'manufacturing-operator',
  'customer-success',
  'brand-manager',
  'sales-leader'
]

export var handler = async function (event) {
  try {
    var data = JSON.parse(event.body)

    // Honeypot spam check then validate input
    if (isSpam(data.website, event)) { return respond(400, { error: 'Invalid submission' }) }
    if (!data.job || !validJobs.includes(data.job)) { return respond(400, { error: 'Please select a valid job position' }) }
    if (!data.name || data.name.trim().length === 0) { return respond(400, { error: 'Name is required' }) }
    if (data.name.trim().length > 350) { return respond(400, { error: 'Name is too long (max 350 characters)' }) }
    if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { return respond(400, { error: 'Valid email is required' }) }
    if (data.email.trim().length > 450) { return respond(400, { error: 'Email is too long (max 450 characters)' }) }
    if (data.linkedin && data.linkedin.trim().length > 500) { return respond(400, { error: 'LinkedIn/Website URL is too long (max 500 characters)' }) }
    if (!data.statement || data.statement.trim().length === 0) { return respond(400, { error: 'Application statement is required' }) }
    if (data.statement.trim().length > 10000) { return respond(400, { error: 'Application statement is too long (max 10000 characters)' }) }

    // Prepare data
    var timestamp = Date.now()
    var email = data.email.trim().toLowerCase()
    var applicationItem = {
      pk: 'website#careers#application',
      sk: email,
      job: data.job,
      name: data.name.trim(),
      email,
      linkedin: data.linkedin ? data.linkedin.trim() : null,
      statement: data.statement.trim(),
      timestamp,
      createdAt: new Date().toISOString()
    }

    // Save to DynamoDB and send email (parallel)
    await Promise.all([
      docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: applicationItem
      })),
      sesClient.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: `New Job Application: ${data.job} from ${data.name.trim()}` },
          Body: { Html: { Data: createEmailBody(data) } }
        }
      }))
    ])

    return respond(200, {
      message: 'Application submitted successfully',
      timestamp
    })

  } catch (error) {
    console.log('Error processing job application:', error)
    return respond(500, { error: 'Failed to process application' })
  }
}

function respond (code, message) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  }
}
