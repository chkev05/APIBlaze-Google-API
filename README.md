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