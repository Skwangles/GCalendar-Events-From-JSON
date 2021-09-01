
//Code & setup provided by https://developers.google.com/calendar/api/quickstart/nodejs (Make sure to add yourself as test user to authenticate -- Also make sure to create a calendarAPI and provide the credentials for it)
//const getC = require('./getCalendar');
const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { exception } = require('console');
const timetableCalendarName = "Timetable-Wintech";
const timeZone = "Pacific/Auckland";
var eventDetailList;
var timetableCalendarID;
let findCalendarLoopCount = 0;
var defaultRecurranceCount = 0;//defines how many recurring instances of an event is

//Files in System
const TIMETABLE_PATH = 'timetable.json';
const TOKEN_PATH = 'token.json';


//TO CREATE MULTIPLE EVENTS ADD THEIR DETAILS TO THE FOLLOWING LIST-----------------------------------------
//
//list JSON contains .name, .start, .location, .time (dateTime object), .endTime, recurrence(Optional: default 12)
//
//var eventDetailList = [{
//
//   "name": "",
//   "time": new Date(2021, 0, 0, 0, 0, 0, 0).toISOString(),
//   "endTime": new Date(2021, 0, 0, 0, 0, 0, 0).toISOString(),
//   "location": "",
//   "recurrence": 2
// }, {
//
//
//----------NOTE: Read in from file has NOT been tested, a hardcoded JSON value was previously used. 


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/calendar.events'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
//
//

//Load client timetable variables from localfile
get_timetable();

function get_timetable(){
  fs.readFile(TIMETABLE_PATH, (err, content) => {
   if (err) return console.log('Error loading Timetable JSON:', err);
    eventDetailList = JSON.parse(content)
    
     });
 }

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

function createEventWithAuth(details, callback, increment) {//Creates Events in calendar
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorizeWithEvent(JSON.parse(content), details, callback, increment);
  });
}

function authorizeWithEvent(credentials, details, callback, increment,) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, details, increment);
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
  }, (error, response) => {
    if (error) return console.log('The API returned an error: ' + error);
    const calendarResource = response.data.items;
    //console.log(JSON.stringify(calendarResource));
    var isTimetableFound = false;
    if (calendarResource.length) {//loops through the list of calendars
      console.log("---looping---");
      calendarResource.map((calendarInAccount, i) => {
        if (isTimetableFound) return;
        if (calendarInAccount.summary == timetableCalendarName) {
          console.log("Found calendar");
          timetableCalendarID = calendarInAccount.id;
          console.log("ID=" + timetableCalendarID);
          isTimetableFound = true;
          // createEventWithAuth(evenDetailList, AddEvent);
        }
        console.log(`${calendarInAccount.summary}`);
      });
    }

    if (!isTimetableFound) {
      console.log("Calendar not found - Creating Calendar");
      callWithAuth(createAndFindCalendar);//finds the created or creates it calendar
    } else {
      callWithAuth(deleteCalendar);//deletes then creates calendar
    }
    console.log(timetableCalendarID);
  });
  console.log("Finished");
}
//
//---------------------------
//

function deleteCalendar(auth) {
  const authenticatedCalendar = google.calendar({ version: 'v3', auth });
  const myPromise = new Promise((resolve, reject) => {
    authenticatedCalendar.calendars.delete({
      "calendarId": timetableCalendarID
    })
    timetableCalendarID = undefined;
    resolve("Deleted");
  })
  myPromise.then(message => {
    console.log(google.calendar({ version: 'v3', auth }));
    callWithAuth(createAndFindCalendar);//finds the created or creates it calendar
  }).catch(message => {
    throw new exception("Something went wrong during the delete calendar function - promise threw");
  });;
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
  }).catch(message => {
    throw new exception("Something went wrong during the create&findcalendar function - promise threw");
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
    findCalendarLoopCount++;
    const authenticatedCalendar = google.calendar({ version: 'v3', auth });// gets JSON
    console.log("Getting new calendar list");

    authenticatedCalendar.calendarList.list({/*Add modifiers to narrow down calendars*/ }, (error, response) => {// gets the list of calendars, then provides logic to the JSON
      if (error) return console.log('The API returned an error: ' + error);
      const calendarResource = response.data.items;
      var isTimetableFound = false;// exit variable
      console.log("---Looping---");
      const mypromise2 = new Promise((resolve, reject) => {
        calendarResource.map((calendarList, increment) => {//--------FINDING CALENDAR BY NAME----------
          if (isTimetableFound) return;
          if (calendarList.summary == timetableCalendarName) {
            timetableCalendarID = calendarList.id;
            isTimetableFound = true;
            console.log("Found Calendar at: " + calendarList.id)
          } else
            console.log("Checked: " + calendarList.summary);
        });
        resolve("All g");
      });

      mypromise2.then(message => {
        if (isTimetableFound) {
          console.log("--Calendar found:" + timetableCalendarID);
          createEventWithAuth(eventDetailList, AddEvent, 0);
        } else {
          console.log("Calendar not found -- Checking again");
          callWithAuth(FindCalendar);// if not found, loop again.
        }
      }).catch(message => {
        throw new exception("Something went wrong during the FindCalendar function - promise threw");
      });

    });
  }
}

//details JSON contains .name, .location, .time (dateTime object), .endTime
function AddEvent(auth, details, itemIncrement) {
  const calendar = google.calendar({ version: 'v3', auth });

  if (timetableCalendarID == undefined) throw new exception("Undefined ID");
  var promise1 = new Promise((resolve, reject) => {
    console.log("Inserting Item " + itemIncrement + " C:" + timetableCalendarID);
    calendar.events.insert({
      'calendarId': timetableCalendarID,
      'resource': {
        "summary": details[itemIncrement].name,
        "description": details[itemIncrement].name + " at " + details[itemIncrement].location,
        "location": details[itemIncrement].location,

        "start": {
          "dateTime": details[itemIncrement].time,
          "timeZone": timeZone
        },
        "end": {
          "dateTime": details[itemIncrement].endTime,//find way to increase dateTime by 1
          "timeZone": timeZone
        },
        "recurrence": [
          "RRULE:FREQ=WEEKLY;COUNT=" + (details[itemIncrement].recurrence == undefined ? defaultRecurranceCount.toString() : details[itemIncrement].recurrence.toString())//change from WEEKLY to DAILY if you want to change the recurrence to, funnily enough, daily.
        ]

      }
    }, (err, res) => {

      if (err) {
        console.log("The API returned error: " + err);
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
  //
  //------
  //
  promise1.then(res => {
    console.log("found Calendar & Created events");
    if (itemIncrement + 1 < details.length) {
      console.log(itemIncrement++);
      createEventWithAuth(details, AddEvent, itemIncrement);
    }

  }).catch(err => {
    console.log("Failed, trying again.");
    callWithAuth(FindCalendar);
  });
}
