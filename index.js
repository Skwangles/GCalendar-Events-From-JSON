
//Code & setup provided by https://developers.google.com/calendar/api/quickstart/nodejs (Make sure to add yourself as test user to authenticate -- Also make sure to create a calendarAPI and provide the credentials for it)
//const getC = require('./getCalendar');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { exception } = require('console');
const timetableCalendarName = "Timetable-Wintech";
const timeZone = "Pacific/Auckland";
var timetableCalendarID;
let findCalendarLoopCount = 0;
var defaultRecurranceCount = 12;//defines how many recurring instances of an event is


//
//TO CREATE MULTIPLE EVENTS ADD THEIR DETAILS TO THE FOLLOWING LIST-----------------------------------------
//
//list JSON contains .name, .start, .location, .time (dateTime object), .endTime, recurrence(Optional: default 12)

var evenDetailList = [{

  "name": "first event",
  "time": new Date(2021, 5, 29, 9, 30, 0, 0).toISOString(),
  "endTime": new Date(2021, 5, 29, 10, 30, 0, 0).toISOString(),
  "location": "Yo Mama's house",
  "recurrence": 10
}, {

  "name": "second event",
  "time": new Date(2021, 5, 29, 12, 30, 0, 0).toISOString(),
  "endTime": new Date(2021, 5, 29, 13, 30, 0, 0).toISOString(),
  "location": "Yo Mama's house again"

}
];
//
//
//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
//
// Load client secrets from a local file 
callWithAuth(listCalendars);//--------------------------------------------------------------------PROGRAM RUN-------------------------
//
//
//

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function callWithAuth(callback) {//calls passed function with auth token ---- Used for calling Calendar operations
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), callback);
  });
}

function createEventWithAuth(details, callback) {//Creates Events in calendar
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorizeWithEvent(JSON.parse(content), details, callback);
  });
}

function authorizeWithEvent(credentials, details, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, details);
  });
}

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}


//
//
//
//
//----Alexander's API Calendar Code----
//
//
//
//
/**
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCalendars(auth) {//gets and lists all calendars. Next place is to add logic - if name == timetable-calendar-name then return id, else make one?
  const authenticatedCalendar = google.calendar({ version: 'v3', auth });
  authenticatedCalendar.calendarList.list({
    maxResults: 100,
  }, (error, resource) => {
    if (error) return console.log('The API returned an error: ' + error);
    const calendarResource = resource.data.items;
    console.log(JSON.stringify(calendarResource));
    var isTimetableFound = false;
    if (calendarResource.length) {
      console.log("---looping---");
      calendarResource.map((calendarInAccount, i) => {

        if (calendarInAccount.summary == timetableCalendarName) {
          console.log("Found calendar");
          timetableCalendarID = calendarInAccount.id;
          console.log("ID=" + timetableCalendarID);
          isTimetableFound = true;
          createEventWithAuth(evenDetailList, AddEvent);
        }
        console.log(`${calendarInAccount.summary}`);
      });
    }

    if (!isTimetableFound) {
      console.log("Calendar not found - Creating Calendar");
      callWithAuth(createAndFindCalendar);//finds the created or creates it calendar
    }
    console.log(timetableCalendarID);
  });
  console.log("Finished");
}
//
//--------------------------
//
function createAndFindCalendar(auth) {
  const authenticatedCalendar = google.calendar({ version: 'v3', auth });//gets JSON of the calendar
  const waitForInsertPromise = new Promise((resolve, reject) => {
    authenticatedCalendar.calendars.insert({
      "resource": {
        "summary": timetableCalendarName
      }
    });
    resolve("Calendar Created");
  });

  waitForInsertPromise.then((message) => {
    console.log(message + " - Now making new calendar instance");
    callWithAuth(FindCalendar);
  });
}
//
//--------------------------
//
function FindCalendar(auth) {//loops through list of Calendars retrieved, if found to have the 
  if (findCalendarLoopCount > 10) {//breaks infinite loop
    findCalendarLoopCount = 0;
    console.log("Error - Cannot find calendar, cutting loop");
    throw new exception("Calendar can't be found/was not created");
  } else {
    const authenticatedCalendar = google.calendar({ version: 'v3', auth });// gets JSON
    console.log("Getting new calendar list");

    authenticatedCalendar.calendarList.list({/*Add modifiers to narrow down calendars*/ }, (error, resource) => {// gets the list of calendars, then provides logic to the JSON
      if (error) return console.log('The API returned an error: ' + error);
      const calendarResource = resource.data.items;
      var isTimetableFound = false;// exit variable
      if (calendarResource.length) {
        console.log("---Looping---");
        calendarResource.map((calendarList, increment) => {//--------FINDING CALENDAR BY NAME----------
          if (isTimetableFound) return;
          if (calendarList.summary == timetableCalendarName) {
            timetableCalendarID = calendarList.id;
            isTimetableFound = true;
            console.log("Found Calendar at: " + calendarList.id)
          } else
            console.log("Checked: " + calendarList.summary);
        });

        if (isTimetableFound) {
          console.log("--Calendar found:" + timetableCalendarID);
          createEventWithAuth(evenDetailList, AddEvent);
        } else {
          console.log("Calendar not found -- Checking again");
          callWithAuth(FindCalendar);// if not found, loop again.
        }

      }
    });
  }
}

function CombineDateAndTime(date) {
  var timeString = date.getHours() + ':' + date.getMinutes() + ':00';
  var ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  var year = date.getFullYear();
  var month = date.getMonth() + 1; // Jan is 0, dec is 11
  var day = date.getDate();
  var dateString = '' + year + '-' + month + '-' + day;
  var datec = dateString + 'T' + timeString;
  var combined = new Date(datec);

  return combined;
};
//details JSON contains .name, .location, .time (dateTime object), .endTime
function AddEvent(auth, details) {
  const calendar = google.calendar({ version: 'v3', auth });
  for (itemIncrement = 0; itemIncrement < details.length; itemIncrement++) {
    console.log("Inserting Item " + itemIncrement + " T:" + details[itemIncrement].time + "C:" +  timetableCalendarID);
    
    if (timetableCalendarID == undefined) throw new exception("Undefined ID");
    calendar.events.insert({
      'calendarId': timetableCalendarID,
      'resource': {
        "summary": details[itemIncrement].name,
        "description": details[itemIncrement].name + " at " + details.location,
        "location": details[itemIncrement].location,

        "start": {
          "dateTime": details[itemIncrement].time,
          "timeZone": timeZone
        },
        "end": {
          "dateTime": details[itemIncrement].endTime,//find way to increase dateTime by 1
          "timeZone": timeZone

        },
        "recurrence":[
          "RRULE:FREQ=WEEKLY;COUNT="+ (details[itemIncrement].recurrence == undefined?defaultRecurranceCount:details[itemIncrement].recurrence)
        ]

      }
    }, (err, res) => {
      console.log(res);
      if (err) return console.log("The Api returned and error: "+ err);
      console.log("Completed one!");

    });
  }
}
