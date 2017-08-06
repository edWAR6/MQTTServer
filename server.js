const mqtt = require('mqtt')
const fs = require('fs');
const sts = require('string-to-stream');
const client = mqtt.connect({
  host: 'm12.cloudmqtt.com',
  port: 17269,
  username: 'bjakjzet',
  password: 'Ja0pHkgWxr6l'
});
const Readable = require('stream').Readable
const ConversationV1 = require('watson-developer-cloud/conversation/v1');
const SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');

let connected = false;
let conversation = new ConversationV1({
  username: '84c76a0b-81dc-4567-a12d-6d2945714c77',
  password: 'DB2flACGy7rI',
  path: { workspace_id: 'df28d2dd-20e5-4ee9-8677-4a69bf0145bd' },
  version_date: '2016-07-11'
});
let speechToText = new SpeechToTextV1 ({
  username: '01a4ce62-ebab-432e-84ed-a4cf5d8712ff',
  password: '6JTpko68GUoC'
});
let speechToTextParams = {
  model: 'es-ES_BroadbandModel',
  content_type: 'audio/ogg',
  'interim_results': false,
  'max_alternatives': 1,
  'word_confidence': false,
  timestamps: false
};

client.on('connect', () => {
  client.subscribe('careable/connected');
  client.subscribe('careable/voice');
})

client.on('message', (topic, message) => {
  switch (topic) {
    case 'careable/connected':
      return handleConnected(message);
    case 'careable/voice':
      return handleVoice(message);

  }
})

function handleConnected (message) {
  console.log('Connected status %s', message);
  connected = (message.toString() === 'true');
  conversation.message({}, processResponse);
}

function handleVoice (message) {
  console.log(message.length);
  fs.writeFile('voice.ogg', message.toString(), 'base64', (err)=>{
    if (err) {
      return console.log(err);
    }
    speechToTextParams.audio = fs.createReadStream('voice.ogg');
    speechToText.recognize(speechToTextParams, (err, transcript)=>{
      if (err) {
        console.log('Error:', err);
      } else {
        let text = transcript.results[0].alternatives[0].transcript;
        conversation.message({input: { text: text }}, processResponse);
      }
    });
  });
}

function processResponse(err, response) {
  if (err) {
    console.error(err);
    return;
  }
  if (response.output.text.length != 0) {
    client.publish('careable/say', response.output.text[0]);
  }
}
