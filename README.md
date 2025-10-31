# APIBlaze-Google-API
APIBlaze coding challenge that utilizes Google and Gmail API to login and send an email. 

## Getting Started

Follow these steps to get the project up and running locally.

### Step 1: Clone the repository

Click on the green **Code** button, copy the SSH link, then run this command in your terminal:

```bash
git clone <Copied-SSH>
```

### Step 2: Install Node.js and npm

Make sure you have [Node.js](https://nodejs.org/) installed on your machine. Installing Node.js will also install npm automatically.

#### Installing Node.js and npm

- **Windows / macOS**:  
  1. Go to the [Node.js download page](https://nodejs.org/).  
  2. Download the **LTS** version (recommended for most users).  
  3. Run the installer and follow the setup instructions.  
  4. Verify installation by running:

```bash
node -v
npm -v
```

### Step 3: Install Packages

Navigate to the backend folder and install the required packages:

```bash
cd backend
npm install
```

### Step 4: Set Up Enviornment Variables

1. Rename the provided `.env.txt` file to `.env`:

2. Open the .env file and fill in the required values

```
SESSION_SECRET=your_session_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:3000/redirect
```

### Step 4: Run the Project

Once the dependencies are installed and the env is setup, start the backend server by running:

```bash
npm start
```

By default, the server will run on http://localhost:3000 (or as specified in your configuration).

### Step 4.5: Regarding Email Information

Email credentials or configuration details will be provided separately via email.

## Vercel Deployment

Before deploying, go to your Vercel project → **Settings → Environment Variables**, and add the following:

GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
REDIRECT_URI=https://your-project.vercel.app/redirect
SESSION_SECRET=your_session_secret

### How your OAuth and Gmail integration works

When the server starts, it serves the login.html landing page. From there you can click the "Sign in with Google" button that redirects you to Google's OAuth 2.0 signin page.

Upon successful sign in, Google redirects you back to the provided URI route, in this case it would be /redirect. The backend then exchanges the auth code for an access and refresh token since we are running it offline and stores them in the user's session.

After that the user is then sent to the send-email.html page, which provides a simple email form to send an email to whoever. This works because I included Gmail send in my scope and enabled the Gmail API in my Google Cloud. I’ve also added a rate limiter to prevent users from spamming emails or overloading the server.

There is also a /revoke route that is used to revoke the access token and clear the session when the user wants to sign out. 

Overall the flow and structure may seem a little bit odd because I was working around the URI restriction and trying to make it work on Vercel. I also wasn't 100% sure on how to design it. However it is relatively secure and properly accomplishes the desired tasks. 

### Frameworks or Libraries Used

express  googleapis  express-session  dotenv  crypto  express-rate-limit  path  url  http  https

### Known limitations and future improvements

The current obvious flaw would be that everything runs out of a single server.js file. Splitting the routes, authentication logic, gmail handling, html loading would make it easier to maintain and understand.

Another limitation would be the current access type. Right now it is set to offline meaning it upon getting the access token you are also grabbing the refresh token. Resulting in the token never really expiring unless you manually sign out. In the future it would be better to properly manage token refreshes. 

And lastly it would be how the tokens are stored. They are currently kept in the user session with req.session.tokens. This means that if the server restarts or crashes the tokens are lost. Moving these tokens to a database would remove this worry and make it more reliable. 