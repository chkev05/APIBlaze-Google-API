const http = require('http');
const https = require('https');
const url = require('url');
const { google } = require('googleapis');
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const path = require('path');

require('dotenv').config();

/**
 * To use OAuth2 authentication, we need access to a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/redirect"
);

/**
 * Access scopes for Gmail send.
 */
const scopes = [
  'https://www.googleapis.com/auth/gmail.send'
];

/**
 * main function to set up the Express server and routes.
 */
async function main() {
  const app = express();

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }));

  app.use(express.static(path.join(__dirname, '../frontend')));

  app.get('/', (req, res) => {
    res.sendFile('login.html', { root: path.join(__dirname, '../frontend') });
  });

  // redirecting user to Google's OAuth 2.0 server.
  app.get('/auth/google', async (req, res) => {

    // Generate a secure random state value.
    console.log('Generating state token for CSRF protection.');
    const state = crypto.randomBytes(32).toString('hex');

    // Store state in the session
    req.session.state = state;

    // Generate a url that asks permissions for the gmail send scope
    const authorizationUrl = oauth2Client.generateAuthUrl({

      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      
      /** 
       * Pass in the scopes array defined above.
      */
      scope: scopes,

      // Enable incremental authorization. Recommended as a best practice.
      include_granted_scopes: true,

      // Include the state parameter to reduce the risk of CSRF attacks.
      state: state
    });

    res.redirect(authorizationUrl);
  });

  // Receive the callback from Google's OAuth 2.0 server.
  app.get('/redirect', async (req, res) => {

    // Handle the OAuth 2.0 server response
    let q = url.parse(req.url, true).query;

    // if error returned from OAuth 2.0 server
    if (q.error) {
      console.log('Error:' + q.error);
    } 

    // check if valid state value
    else if (q.state !== req.session.state) {
      console.log('State mismatch. Possible CSRF attack');
      res.end('State mismatch. Possible CSRF attack');
    } 
    
    // Get access and refresh tokens (if access_type is offline)
    else {
        try {
            const { tokens } = await oauth2Client.getToken(q.code);
            oauth2Client.setCredentials(tokens);
            req.session.tokens = tokens;

            console.log('✅ Tokens stored in session: success');
            res.redirect('/email-form');
        } 
        catch (err) {
            console.error('Error exchanging code for tokens:', err);
            res.send('❌ Error during authentication.');
        }
    }
  });

  // Revoking a token for sign out
  app.get('/revoke', async (req, res) => {

    // Check if tokens exist in session
    if (!req.session.tokens) {
      console.log('No tokens to revoke.');
      return res.redirect('/');
    }

    const postData = "token=" + req.session.tokens.access_token;

    // Options for POST request to Google's OAuth 2.0 server to revoke a token
    const postOptions = {
      host: 'oauth2.googleapis.com',
      port: '443',
      path: '/revoke',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    try {
      await new Promise((resolve, reject) => {
        const postReq = https.request(postOptions, function (postRes) {
          postRes.setEncoding('utf8');
          let data = '';
          postRes.on('data', chunk => data += chunk);
          
          // On end of response from Google's server successfully revoke redirect to homepage
          postRes.on('end', () => {
            console.log('Response: ' + data);
            req.session.tokens = null; // Clear session tokens
            console.log('✅ Tokens revoked and cleared from session.');
            resolve();
          });
        });

        postReq.on('error', (err) => {
          reject(err);
        });

        // Post the request with data
        postReq.write(postData);
        postReq.end();
      });

    } catch (err) {
      console.error('Error revoking token:', err);
      return res.send('❌ Error revoking token.');
    }

    // Redirect after successful revoke
    return res.redirect('/');
  });

  // Serve the email form if authenticated
  app.get('/email-form', (req, res) => {

    // Check if tokens exist in session if not redirect to homepage
    if (!req.session.tokens) {
        return res.redirect('/');
    }

    // Serve the email form HTML file
    res.sendFile('send-email.html', { root: '../frontend' });
  });

  app.use(express.urlencoded({ extended: true }));

  const rateLimit = require('express-rate-limit');

  // Rate limiter middleware for email sending
  const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // max 10 requests per window per IP
    message: 'Too many emails sent, try again later.'
  });

  // Handle email sending from the email-form
  app.post('/send-email', emailLimiter, async (req, res) => {
    const { to, subject, body } = req.body;

    // console.log(req.session.tokens);

    // Check if user is authenticated if not send error message
    if (!req.session.tokens) {
      console.log('❌ Session tokens missing:', req.session); // prints in server terminal
      console.log('User is not logged in. Redirecting to login page.' , req.session.tokens);
      return res.send(`
        <h2>❌ You must be logged in to send an email.</h2>
        <a href="/">Go to Login</a>
      `);
    }

    // Set the OAuth2 client credentials from session tokens
    oauth2Client.setCredentials(req.session.tokens);

    try {
      // Create Gmail API client
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Create raw email message (RFC 2822 format, base64 encoded)
      const rawMessage = [
        `To: ${to}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${subject}`,
        '',
        body,
      ].join('\n');

      // Encode the message in base64url format
      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send the message
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      res.send(`
        <h2>Email sent successfully via Gmail API! ✅</h2>
        <p>To: ${to}</p>
        <p>Subject: ${subject}</p>
        <a href="/email-form">Send Another</a>
      `);
    } catch (error) {
      console.error('Error sending email:', error);
      res.send(`
        <h2>❌ Failed to send email.</h2>
        <pre>${error}</pre>
        <a href="/email-form">Try Again</a>
      `);
    }
  });

  const server = http.createServer(app);
  const PORT = 3000;
  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
main().catch(console.error);