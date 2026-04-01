const express = require("express");
const app = express();

app.use(express.json());

const PORT = 3000;
let currentSession = null;
const EVENT_TYPES = ["PARAM_CHANGE", "PAUSE", "RESUME", "STOP"];



//----Routes----

app.post("/session/start", (req, res) => {

  const { height, distance } = req.body || {};

  //validate input
  
  if (height == null || distance == null) {
    return res.status(400).send(buildErrorObject("Invalid input: height and distance are required", "INVALID_INPUT"));
  }

  if (!Number.isFinite(height) || !Number.isFinite(distance)) {
    return res.status(400).send(buildErrorObject("Invalid input: height and distance must be numbers", "INVALID_INPUT"));
  }

  if (height <= 0 || distance < 0) {
    return res.status(400).send(buildErrorObject("Invalid input: height must be greater than 0 and distance must be non-negative", "INVALID_INPUT"));
  }
  

  currentSession = {
  id: Date.now(),
  startTime: new Date(),
  active: true,
  scenario: {
    height,
    distance
  },
  events: []
  };
  res.status(201).send(currentSession);
});

app.post("/session/event", (req, res) => {
  if (!currentSession || !currentSession.active) {
    return res.status(409).send(buildErrorObject("No active session. Please start a session first.", "NO_ACTIVE_SESSION"));
  }
  // status 409 is used to indicate that the request could not be completed due to a conflict with the current state of the resource, which in this case is the absence of an active session.

  const { type, value } = req.body || {};

  //validate input
  if (typeof type !== "string" ) {
    return res.status(400).send(buildErrorObject("Invalid input: event type must be a string", "INVALID_INPUT"));
  }

  let normalizedType = type.trim().toUpperCase();

  if(!isValidEventType(normalizedType)) {
    return res.status(400).send(buildErrorObject("Invalid input: event type must be one of the allowed event types: " + EVENT_TYPES.join(", "), "INVALID_INPUT"));
  }
  // value is optional, so stored even if it is null or undefined.
  const event = {id: Date.now(), type: normalizedType, value, timestamp: new Date()};
  currentSession.events.push(event);
  res.status(201).send(event);
});

app.get("/session/current", (req, res) => {
  if (!currentSession) {
    return res.status(404).send(buildErrorObject("No session detected", "NO_SESSION"));
  }
  res.status(200).send(currentSession);
});

app.post("/session/end", (req, res) => {
  if (!currentSession || !currentSession.active) {
    return res.status(409).send(buildErrorObject("No active session to end", "NO_ACTIVE_SESSION"));
  }
  currentSession.active = false;
  currentSession.endTime = new Date();
  res.status(200).send(currentSession);
});

app.get("/", (req, res) => {
  res.send("VR Exposure Backend Running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//----Helper Functions----

function buildErrorObject(message, errorCode) {
  const errorObject = {message, timestamp: new Date(), errorCode};
  return errorObject;
}

function isValidEventType(type) {
  return EVENT_TYPES.includes(type);
}