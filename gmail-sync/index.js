const {google} = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2([
  process.env.GOOGLE_CLOUD_CLIENT_ID,
  process.env.GOOGLE_CLOUD_CLIENT_SECRET,
  '<REDIRECT_URI>'
]);

oauth2Client.credentials = {};
// oauth2Client.setCredentials({
//   refresh_token: content.refresh_token,
//   access_token: content.access_token,
// });

const gmail = google.gmail('v1', oauth2Client);

    // scopes: [
    //   'https://mail.google.com/',
    //   'email',
    //   'profile'
    // ]

async function watch() {
  const res = await gmail.users.watch({
    userId: 'me',
    requestBody: {
      topicName: `projects/rootvc-access/topics/rootvc-access-topic` // TODO: env vars for project and topic
    }
  });

  console.log(res.data);
}

exports.watch = (request, response) => {
  watch();
  response.status(200).send('OK');
};

exports.event = (event, callback) => {
  callback();
};
