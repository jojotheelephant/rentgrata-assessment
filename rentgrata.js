"use strict";

/* 
code flows as follows: 
1. Read arguments from console
2. Get array of IDs of users
3. Get all requested user events and convert to ISO standard
4. Sort all events by date and time
5. Separate events into by date
6. Iterate through events to search for gaps between events
7. Format time/date for output
8. Return formatted availability 
*/

const fs = require("fs");

// pull data from files
const eventsData = fs.readFileSync("events.json");
const events = JSON.parse(eventsData);
const usersData = fs.readFileSync("users.json");
const users = JSON.parse(usersData);

// returns array of arguments when rentgrata.js is called in commandline.
const args = process.argv.slice(2);

// returns array of id of corresponding user arguments
const usersArrayById = [];

for (let j = 0; j < args.length; j++) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].name === args[j]) {
            usersArrayById.push(users[i].id);
        }
    }
}

// returns all events with user_id matches usersArrayById and date changed to ISO standard in UTC time.
let allEventsFromInputUsers = [];
for (let i = 0; i < events.length; i++) {
    for (let j = 0; j < usersArrayById.length; j++) {
        if (events[i].user_id === usersArrayById[j]) {
            events[i].start_time = new Date(`${events[i].start_time}Z`);
            events[i].end_time = new Date(`${events[i].end_time}Z`);
            allEventsFromInputUsers.push(events[i]);
        }
    }
}

// sorts allEventsFromInputUsers array by date and time in ascending order
allEventsFromInputUsers.sort((a, b) => {
    return a.start_time - b.start_time;
});

// add beginning and end times and dates. Find all void times between the constraints and list onto array
let startOfDayTime = 13;
let endOfDayTime = 21;
let year = 2021;
const monthIndex = 6;
let startDate = 5;
let endDate = 7;

// assign events into Array where each index is an array of events sorted by Date.
const eventsFilteredByUserAndDate = [];
for (let date = startDate; date <= endDate; date++) {
    eventsFilteredByUserAndDate.push(allEventsFromInputUsers.filter((event) => event.start_time.getUTCDate() == date));
}

// format time string to be two digits when less than two digits.
const formatTime = (time) => {
    return ("0" + time).slice(-2);
};

// format strings for output.
const formatTimeStringForOutput = (time1, time2) => {
    return `${year}-0${monthIndex + 1}-0${time1.getUTCDate()} ${formatTime(time2.getUTCHours())}:${formatTime(
        time2.getUTCMinutes()
    )} - ${formatTime(time1.getUTCHours())}:${formatTime(time1.getUTCMinutes())}`;
};

// map through each index and find availability gaps
const availableTimes = [];

eventsFilteredByUserAndDate.map((event) => {
    let startTimeOfTheDay = new Date(Date.UTC(year, monthIndex, event[0].start_time.getUTCDate(), startOfDayTime));
    let endOfDateTime = new Date(Date.UTC(year, monthIndex, event[0].start_time.getUTCDate(), endOfDayTime));
    let currentTime = startTimeOfTheDay;
    for (let i = 0; i < event.length; i++) {
        // first scenario where i === 0 and there is gap betwen start of day and first event
        if (i === 0 && event[i].start_time > currentTime) {
            availableTimes.push(formatTimeStringForOutput(event[i].start_time, currentTime));
            // second scenario to check if there is availability after last event of the day
        } else if (i === event.length - 1) {
            if (event[i].start_time > currentTime) {
                availableTimes.push(formatTimeStringForOutput(event[i].start_time, currentTime));
            }
            if (event[i].end_time < endOfDateTime) {
                availableTimes.push(formatTimeStringForOutput(endOfDateTime, event[i].end_time));
            }
            // if there are availability between events
        } else if (i !== event.length - 1 && event[i].start_time > currentTime) {
            availableTimes.push(formatTimeStringForOutput(event[i].start_time, currentTime));
        }
        // updates currentTime to latest availability
        currentTime = currentTime > event[i].end_time ? currentTime : event[i].end_time;
    }
    // add gap between event sections
    availableTimes.push(" ");
});

// print to console
console.log(availableTimes.join(" \n"));
