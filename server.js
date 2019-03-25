// server.js
// where your node app starts

// init project
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', process.env.SLACK_SS);

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


  /////////////////////////////////
 /////////   DATABASE   //////////
/////////////////////////////////


// init sqlite db
const fs = require('fs');
const dbFile = './.data/sqlite.db';
var exists = fs.existsSync(dbFile);
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
// db.serialize(function(){
//   if (!exists) {
//     db.run('CREATE TABLE Dreams (dream TEXT)');
//     console.log('New table Dreams created!');
    
//     // insert default dreams
//     db.serialize(function() {
//       db.run('INSERT INTO Dreams (dream) VALUES ("Find and count some sheep"), ("Climb a really tall mountain"), ("Wash the dishes")');
//     });
//   }
//   else {
//     console.log('Database "Dreams" ready to go!');
//     db.each('SELECT * from Dreams', function(err, row) {
//       if ( row ) {
//         console.log('record:', row);
//       }
//     });
//   }
// });


  ///////////////////////////////
 /////////   ROUTES   //////////
///////////////////////////////


// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// endpoint to get all the dreams in the database
// currently this is the only endpoint, ie. adding dreams won't update the database
// read the sqlite3 module docs and try to add your own! https://www.npmjs.com/package/sqlite3
app.get('/getDreams', function(request, response) {
  db.all('SELECT * from Dreams', function(err, rows) {
    response.send(JSON.stringify(rows));
  });
});

app.post('/chat', eventHandler);

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});



  ////////////////////////////////
 /////////   HELPERS   //////////
////////////////////////////////


function eventHandler(req, res){
  
  let isValid = validateRequest(req);
  
  if (!isValid){
    res.status(401);
    res.send('Unauthorized');
    return;
  }
  
  // respond to slack url verification for app setup
  if (req.body.type === "url_verification"){
    console.log(req.body.challenge);
    res.set('Content-Type', 'text/plain');
    res.send(req.body.challenge);
  }
}

function validateRequest(req){
  
  const sss = req.get('X-Slack-Signature');
  const ts = req.get('X-Slack-Request-Timestamp');
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - (60 * 5);
  
  if (!sss || !ts){
    console.log('Could not find required headers');
    return false;
  }
  
  if (ts < fiveMinutesAgo){
    console.log(`Time limit failure for TS: ${ts}`);
    return false; 
  }
    
  const body = JSON.stringify(req.body);
  const [v, hash] = sss.split('=');
  const slackSS = process.env.SLACK_SS;
  hmac.update(`${v}:${ts}:${body}`);

  if (hash === hmac.digest('hex')){
    console.log('Success: Hashes verified');
    return true;
  }
  
  console.log('Hashes did not match');
  return false;
}