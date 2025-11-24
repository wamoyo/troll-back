// Pure: generates HTML email body for contact form submission

import html from '../../../utilities/html.js'

export function createEmailBody (data) {
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td style="padding: 30px 20px 0px 20px;">
        <img src="http://trollhair.com/images/Troll-Hair-Logo-Red-Text-300.png" alt="Troll Hair" width="300" height="113" style="display: block; width: 100%; max-width: 300px; height: auto;">
      </td>
    </tr>
    <tr>
      <td style="padding: 0 20px; font-size: 16px; line-height: 1.6;">

        <h1 style="max-width: 600px; border-bottom: 2px solid #e22c3b;">New Contact Form Submission</h1>
        <p>We have a contact that came in from the website... (They are not CC'd)</p>

        <p>
          <strong>Name:</strong><br>
          ${data.name}
        </p>

        <p>
          <strong>Email:</strong><br>
          <a href="mailto:${data.email}">${data.email}</a>
        </p>

        <p>
          <strong>Phone:</strong><br>
          ${data.phone || 'Not provided'}
        </p>

        <p>
          <strong>Message:</strong><br>
          ${data.message}
        </p>

        <p style="font-size: 14px;">
          <em>Submitted from trollhair.com on ${new Date().toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
          })}</em>
        </p>

      </td>
    </tr>
  </table>
</body>
</html>`
}
