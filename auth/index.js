require('dotenv').config();
const {google} = require('googleapis');
const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLOUD_CLIENT_ID,
  process.env.GOOGLE_CLOUD_CLIENT_SECRET,
  process.env.GOOGLE_CLOUD_REDIRECT_URI
);
const gmail = google.gmail('v1', oauth2Client);

const pg = require('knex')({
  client: 'pg',
  connection: {
    host : process.env.GOOGLE_CLOUD_SQL_HOST,
    port : 5432,
    user : process.env.GOOGLE_CLOUD_SQL_USERNAME,
    password : process.env.GOOGLE_CLOUD_SQL_PASSWORD,
    database : process.env.GOOGLE_CLOUD_SQL_DATABASE
  }
});

pg.schema.hasTable('grants').then((exists) => {
  if (!exists) {
    return pg.schema.createTable('grants', (t) => {
      t.increments('id').primary();
      t.text('grant_id', 255).notNullable().unique();
      t.text('email', 255);
      t.jsonb('raw_response');
      t.text('access_token', 255).notNullable();
      t.text('refresh_token', 255).notNullable();
      t.text('scope', 255).notNullable();
      t.dateTime('expiry_date').notNullable();
      t.timestamp('updated_at').notNullable().defaultTo(pg.fn.now())
      t.timestamp('created_at').notNullable().defaultTo(pg.fn.now())
    });
  }
});

async function create(request, response) {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  response.redirect(url);
}

async function callback(request, response) {
  const query = request.query;
  const code = query.code;
  const error = query.error;
  const scope = query.scope;

  if (code) {
    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const [record] = await pg('grants')
      .insert({
        'grant_id': code,
        'email': null, // TODO: Lookup
        'raw_response': tokens,
        'access_token': tokens.access_token,
        'refresh_token': tokens.refresh_token,
        'scope': tokens.scope,
        'expiry_date': new Date(tokens.expiry_date),
        'updated_at': pg.fn.now()
      })
      .onConflict('grant_id')
      .merge()
      .returning('*');

    response.status(200).send(record.access_token);
  } else {
    response.status(200).send(error || 'You must authorize RootVC Access in order to use it!');
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
