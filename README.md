## Azure React Continuos GPT

This demo is an extensionof the [Speech-Recognition-React](https://github.com/DavidNavarroSaiz/Speech-Recognition-React) project, it is a webdemo implemented in React, but the main difference is that the analytics of the speech is not done using NER but in this case it is used GPT.
GPT analyzes the speech of the person andextract relevant information, such as names, dates, areas of interest, goals, etc. it is the most stable app and gives the best results.

## How to run 
- you have to install the packages so in the speech_recognitio_app folder runthe comman:
`npm install` 

then create a .env file and copy paste the following variables:

```
REACT_APP_SUBSCRIPTION_KEY=""
REACT_APP_SERVICE_REGION=""
REACT_APP_OPENAI_KEY=""
```


in each variable set the corresponding key:

REACT_APP_SUBSCRIPTION_KEY and REACT_APP_SERVICE_REGION are related with the speech recognition and the speech to text modules of azure.[azure portal](https://portal.azure.com/)


REACT_APP_OPENAI_KEY is the APIKEY of GPT of openAI, which is used to analyze the speech of the user.


## What you will find:

in the `./scr/app.js` file you will find 5 important functions:

### startRecognition():

is the function that get access to the microphone and start the speech recognition, this function is divided in 4 events that are related with the recognizer engine.

speechRecognizer.recognizing : displays in realtime what is the engine recognizing from the speech

speechRecognizer.recognized: when the user makes a pause in the speechit will take that pause as the beggining of a new phrase, so it will start again a new phrase and will separate the phrases by period(. ) at the moment that the user makes a pause the recognized event will be triggered

speechRecognizer.canceled: if the speech recognition fails or is it canceled then this event is activated.

speechRecognizer.sessionStopped: if it is used the command speechRecognizer.stopContinuousRecognitionAsync then the event will be triggered.


startRecognition functiontriggers the speech recognition module with the following command:
speechRecognizer.startContinuousRecognitionAsync()

### stopRecognition():

it is a function that activates the function speechRecognizer.stopContinuousRecognitionAsync();
which stops the recognition.

### clearResult():

the function cleans all the text areas in the web app, and the main variables, that is done to start again from the beggining

### Analyze results():

It uses GPT of OpenAI to analyze the speech recognized it has a input parameter which is the text to be processed and then it writes in the corresponding cell the desired output.
it is used the model 'gpt-3.5-turbo-16k-0613' because it is the faster model that gave very good results.

it is used the following prompt to obtain the desired output as a json format:

``` 
messages: [
            {
              role: "system",
              content: `ignore spaces and dots, Extract the following information in JSON format:\n
                  {
                    "Names": "",
                    "Professions": "",
                    "Ages": "",
                    "Locations": "",
                    "Address": "",
                    "Date": "",
                    "Phone_numbers": "",
                    "Emails": "",
                    "Areas_of_interest": "",
                    "Goals": "",
                    "Other": "none"
                  }`,
            },
            {
              role: "user",
              content: user_input,
              },
          ],

```

after checking the result of the prompt to gpt, it is formated and written in the corresponding cells 


### textToSpeech():

this is a function that uses Azure SpeechSDK to perform text to speech, it takes the text in the `text_to_speech` cell, and reades with a default voice of azure, that voice can be changed deppending on the language. works on different languages.

