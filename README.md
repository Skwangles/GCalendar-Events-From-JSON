#Google calendar CalenderApi

Goal is to take a JSON file input, with the university's/wintect's semester schedule. 

Uses the Google API to create a new Calendar, and then creates the weekly timetable's events for weeks to come in the user's calendar.

To Use:
Must have a Google Calendar API setup in https://console.cloud.google.com/apis/dashboard
You must then download the credentials, to be in the same directory. 
When running, a token file will be generated, which allows the program to run using your personal GCalendar

You also need to pass in a file in the same directory called Timetable.json, this is what contains the desired Timetable events

