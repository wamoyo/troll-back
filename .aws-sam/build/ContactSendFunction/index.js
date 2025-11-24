// Lambda handler for POST /contact/send
// Receives contact form submission, saves to DynamoDB, sends email via SES

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { createEmailBody } from './contact.email.js'
import { isSpam } from './honeypot.js'

var dynamoClient = new DynamoDBClient({})
var docClient = DynamoDBDocumentClient.from(dynamoClient)
var sesClient = new SESClient({})

var TABLE_NAME = process.env.TROLLHAIR_TABLE_NAME
var FROM_EMAIL = process.env.TROLLHAIR_FROM_EMAIL
var TO_EMAIL = process.env.TROLLHAIR_TO_EMAIL

export var handler = async function (event) {
  try {
    var data = JSON.parse(event.body)

    // Honeypot spam check then validate input
    if (isSpam(data.website, event)) { return respond(400, { error: 'Invalid submission' }) }
    if (!data.name || data.name.trim().length === 0) { return respond(400, { error: 'Name is required' }) }
    if (data.name.trim().length > 350) { return respond(400, { error: 'Name is too long (max 350 characters)' }) }
    if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) { return respond(400, { error: 'Valid email is required' }) }
    if (data.email.trim().length > 450) { return respond(400, { error: 'Email is too long (max 450 characters)' }) }
    if (!data.message || data.message.trim().length === 0) { return respond(400, { error: 'Message is required' }) }
    if (data.message.trim().length > 5500) { return respond(400, { error: 'Message is too long (max 5500 characters)' }) }

    // Prepare data
    var timestamp = Date.now()
    var contactItem = {
      pk: 'website#contact',
      sk: data.email.trim(),
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone ? data.phone.trim() : null,
      message: data.message.trim(),
      timestamp,
      createdAt: new Date().toISOString()
    }

    // Save to DynamoDB and send email (parallel)
    await Promise.all([
      docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: contactItem
      })),
      sesClient.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: { Data: `New Contact Form Submission from ${data.name.trim()}` },
          Body: { Html: { Data: createEmailBody(data) } }
        }
      }))
    ])

    return respond(200, {
      message: 'Contact form submitted successfully',
      timestamp
    })

  } catch (error) {
    console.log('Error processing contact form:', error)
    return respond(500, { error: 'Failed to process contact form' })
  }
}

function respond (code, message) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  }
}
