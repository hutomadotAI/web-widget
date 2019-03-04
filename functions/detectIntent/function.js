const dialogflow = require('dialogflow');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;
const JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP = {
  [typeof 0]: 'numberValue',
  [typeof '']: 'stringValue',
  [typeof false]: 'boolValue',
};
const STACKDRIVER_USER_AGENT = 'GoogleStackdriverMonitoring-UptimeChecks(https://cloud.google.com/monitoring)';
const JSON_SIMPLE_VALUE_KINDS = new Set([
  'numberValue',
  'stringValue',
  'boolValue',
]);


/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
exports.detectIntent = (req, res) => {

  console.log(req);

  // We support CORS for all requests
  res.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);

  // We suport OPTIONS, HEAD, and POST methods for all requests
  res.set('Access-Control-Allow-Methods', 'HEAD, OPTIONS, POST');

  // We accept content-type for all requests
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Provide a response for HEAD and OPTION method
  if (req.method === 'HEAD' || req.method === 'OPTIONS') {
    return res.status(200).send();
  }

  // Provide a response for Stackdriver uptime check.
  // Should be removed when other than GET methods will
  // be allowed in uptime checks.
  if (req.get('User-Agent') === STACKDRIVER_USER_AGENT) {
    return res.status(200).send();
  }


  if (req.method != 'POST') {
    let message = `Method ${ req.method } not allowed`;
    console.error('ERROR: ', message);
    return res.status(405).send({ message: message });
  }

  let { projectId, sessionId } = { ...req.query };
  let { query, languageCode = 'en-US', queryParams = {} } = { ...req.body };

  if (!projectId || !sessionId || !query || !languageCode) {
    let message = 'Missing required parameters: projectId, sessionId, query, languageCode';
    console.error('ERROR: ', message);
    return res.status(400).send({ message: message });
  }

  // Instantiate a DialogFlow client.
  const sessionClient = new dialogflow.SessionsClient();

  // Define session path
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: languageCode,
      }
    },
    queryParams: {
      timeZone: queryParams.timeZone,
      // Encode to PROTO we ❤️ PROTO google
      payload: jsonToStructProto(queryParams.payload)
    }
  };



  // Send request and log result
  sessionClient
    .detectIntent(request)
    .then(responses => {
      console.debug('Detected intent', `${ responses }`);
      let [ response ]  = responses;

      // Fix messages returned as google goog.protobuf.Struct, we ❤️ PROTO google
      response.queryResult.fulfillmentMessages = response.queryResult.fulfillmentMessages.map(message =>
    message.payload && Object.keys(structProtoToJson(message.payload)).length ? structProtoToJson(message.payload) : message
    )

      res.status(200).send(response);
    })
    .catch(error => {
      console.error('ERROR: ', error);
      res.status(500).send('error');
    });

};


/**
 * Copyright 2017, Google, Inc.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Utilities for converting between JSON and goog.protobuf.Struct
 * proto.
 */

'use strict';

function jsonToStructProto(json) {
  const fields = {};
  for (const k in json) {
    fields[k] = jsonValueToProto(json[k]);
  }

  return {fields};
}

function jsonValueToProto(value) {
  const valueProto = {};

  if (value === null) {
    valueProto.kind = 'nullValue';
    valueProto.nullValue = 'NULL_VALUE';
  } else if (value instanceof Array) {
    valueProto.kind = 'listValue';
    valueProto.listValue = {values: value.map(jsonValueToProto)};
  } else if (typeof value === 'object') {
    valueProto.kind = 'structValue';
    valueProto.structValue = jsonToStructProto(value);
  } else if (typeof value in JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP) {
    const kind = JSON_SIMPLE_TYPE_TO_PROTO_KIND_MAP[typeof value];
    valueProto.kind = kind;
    valueProto[kind] = value;
  } else {
    console.warn('Unsupported value type ', typeof value);
  }
  return valueProto;
}

function structProtoToJson(proto) {
  if (!proto || !proto.fields) {
    return {};
  }
  const json = {};
  for (const k in proto.fields) {
    json[k] = valueProtoToJson(proto.fields[k]);
  }
  return json;
}

function valueProtoToJson(proto) {
  if (!proto || !proto.kind) {
    return null;
  }

  if (JSON_SIMPLE_VALUE_KINDS.has(proto.kind)) {
    return proto[proto.kind];
  } else if (proto.kind === 'nullValue') {
    return null;
  } else if (proto.kind === 'listValue') {
    if (!proto.listValue || !proto.listValue.values) {
      console.warn('Invalid JSON list value proto: ', JSON.stringify(proto));
    }
    return proto.listValue.values.map(valueProtoToJson);
  } else if (proto.kind === 'structValue') {
    return structProtoToJson(proto.structValue);
  } else {
    console.warn('Unsupported JSON value proto kind: ', proto.kind);
    return null;
  }
}
