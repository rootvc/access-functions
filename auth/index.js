require('dotenv').config();
const {google} = require('googleapis');
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLOUD_CLIENT_ID,
  process.env.GOOGLE_CLOUD_CLIENT_SECRET,
  process.env.GOOGLE_CLOUD_REDIRECT_URI
);
const gmail = google.gmail('v1', oauth2Client);

async function create(request, response) {
  // Check if we have previously stored a token.
  // fs.readFile(TOKEN_PATH, (err, token) => {
  //   if (err) return getNewToken(oAuth2Client, callback);
  //   oAuth2Client.setCredentials(JSON.parse(token));
  //   callback(oAuth2Client);
  // });

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  response.redirect(url);
}

async function callback(request, response) {
  const query = request.query;
  const code = query.code;
  const error = query.error;

  if (code) {
    const {tokens} = await oauth2Client.getToken(code)
    // TODO: Store tokens
    oauth2Client.setCredentials(tokens);
    response.status(200).send(code);
  } else {
    response.status(200).send(error || 'User declined to authorize application.');
  } 
}

exports.create = (request, response) => {
  create(request, response);
};

exports.callback = (request, response) => {
  callback(request, response);
};

exports.event = (event, callback) => {
  callback();
};
