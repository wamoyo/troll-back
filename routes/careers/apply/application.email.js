// Pure: generates HTML email body for job application submission

import html from './utilities/html.js'

// Job ID to title mapping
var jobTitles = {
  'manufacturing-operator': 'Front Line Manufacturing Operator',
  'customer-success': 'Customer Success Manager',
  'brand-manager': 'Brand Manager',
  'sales-leader': 'Sales Team Leader'
}

export function createEmailBody (data) {
  // Style variables for DRY inline styles
  var baseFont = 'margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; line-height: 1.6;'
  var contentCell = 'padding: 0 20px;'
  var italic = 'font-style: italic'
  var h1Style = 'font-size: 1.5em; max-width: 600px; border-bottom: 2px solid #e22c3b;'
  var pStyle = 'font-size: 1em; line-height: 1.6;'
  var mediumPStyle = 'font-size: 1.3em; line-height: 1.6;'
  var smallStyle = 'font-size: 0.875em;'
  var imgStyle = 'display: block; width: 100%; max-width: 300px; height: auto;'

  var jobTitle = jobTitles[data.job] || data.job

  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Job Application</title>
</head>
<body style="${baseFont}">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding: 30px 20px 0px 20px;">
        <img src="http://trollhair.com/images/Troll-Hair-Logo-Red-Text-300.png" alt="Troll Hair" width="300" height="113" style="${imgStyle}">
      </td>
    </tr>
    <tr>
      <td style="${contentCell}">

        <h1 style="${h1Style}">New Job Application</h1>
        <p style="${mediumPStyle}">We have a new job applicant from the website! (They are not CC'd.)</p>

        <p style="${pStyle}">
          <strong>Position:</strong><br>
          ${jobTitle}
        </p>

        <p style="${pStyle}">
          <strong>Name:</strong><br>
          ${data.name}
        </p>

        <p style="${pStyle}">
          <strong>Email:</strong><br>
          <a href="mailto:${data.email}">${data.email}</a>
        </p>

        <p style="${pStyle}">
          <strong>LinkedIn/Website:</strong><br>
          ${data.linkedin ? html`<a href="${data.linkedin}">${data.linkedin}</a>` : 'Not provided'}
        </p>

        <p style="${pStyle}">
          <strong>Application Statement:</strong><br>
          ${data.statement}
        </p>

        <p style="${smallStyle} ${italic}"> Submitted from trollhair.com on ${new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })}</p>

      </td>
    </tr>
  </table>
</body>
</html>`
}
