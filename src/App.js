import React, { useEffect, useState, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
let { Configuration, OpenAIApi } = require("openai");

function App() {
  // State variables
  const [result, setResult] = useState('');
  const [startRecognitionDisabled, setStartRecognitionDisabled] = useState(false);
  const [AnalizeDisabled, setAnalizeDisabled] = useState(true);
  const [stopRecognitionDisabled, setStopRecognitionDisabled] = useState(true);
  const [cleanDisabled, setcleanDisabled] = useState(false);
  const [textToSpeechDisabled, setTextToSpeechDisabled] = useState(false);
  const [inputText, setInputText] = useState('');
  const [languageSelect, setLanguageSelect] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  let finalText = '';

  // Azure Cognitive Services API credentials and client initialization
  const subscriptionKey = process.env.REACT_APP_SUBSCRIPTION_KEY;
  const serviceRegion = process.env.REACT_APP_SERVICE_REGION;
  const endpoint = process.env.REACT_APP_AZURE_LANGUAGE_ENDPOINT;
  const apiKey = process.env.REACT_APP_AZURE_LANGUAGE_KEY;
  const openai_apiKey = process.env.REACT_APP_OPENAI_KEY;
  const { TextAnalysisClient, AzureKeyCredential, } = require("@azure/ai-language-text");
  const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  const [speechRecognizer, setSpeechRecognizer] = useState(null);
  const [synthesizer, setSynthesizer] = useState(null);

  // State variables for storing recognized entities
  const [name, setName] = useState([]);
  const [Profesion, setProfesion] = useState([]);
  const [location, setLocation] = useState([]);
  const [age, setAge] = useState([]);
  const [address, setAddress] = useState([]);
  const [telephone, setTelephone] = useState([]);
  const [dateTime, setDateTime] = useState([]);
  const [Email, setEmail] = useState([]);
  const [AreasOfInterest, setAreasOfInterest] = useState([]);
  const [Goals, setGoals] = useState([]);
  const [otherType, setOtherType] = useState([]);
  let isAnalysisInProgress = false;
  // Speech recognition related functions
  const startRecognition = () => {


    setIsListening(true);
    setStartRecognitionDisabled(true);
    setStopRecognitionDisabled(false);
    setcleanDisabled(true);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechRecognitionLanguage = languageSelect;
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizer.endSilenceTimeout = 3000;
    finalText = '';

    recognizer.recognizing = (_, e) => {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
      setResult(finalText + e.result.text);
    };

    recognizer.recognized = async (_, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        finalText += e.result.text + ' '; // Add a space after each recognized word
        setResult(finalText);

        await AnalyzeResult();
        console.log(`RECOGNIZED: Text=${e.result.text}`);
      } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
        console.log('NOMATCH: Speech could not be recognized.');
      }
    };

    recognizer.canceled = (_, e) => {
      console.log(`CANCELED: Reason=${e.reason}`);

      if (e.reason === SpeechSDK.CancellationReason.Error) {
        console.log(`CANCELED: ErrorCode=${e.errorCode}`);
        console.log(`CANCELED: ErrorDetails=${e.errorDetails}`);
        console.log('CANCELED: Did you set the speech resource key and region values?');
      }

      recognizer.stopContinuousRecognitionAsync();
    };

    recognizer.sessionStopped = () => {
      console.log('\nSession stopped event.');
      recognizer.stopContinuousRecognitionAsync();
    };

    setSpeechRecognizer(recognizer);
  };

  const stopRecognition = () => {
    if (speechRecognizer) {
      speechRecognizer.stopContinuousRecognitionAsync();
      setStartRecognitionDisabled(false);
      setStopRecognitionDisabled(true);
      setcleanDisabled(false);
      setAnalizeDisabled(false);
      setIsListening(false);

      //optional 
      setName('')
      setProfesion('')
      setAge('')
      setLocation('')
      setAddress('')
      setTelephone('')
      setDateTime('')
      setEmail('')
      setAreasOfInterest('')
      setGoals('')
      setOtherType('')
      AnalyzeResult();



      // State variables for storing recognized entities

    }
  };

  // useEffect //to handle continuous recognition
  useEffect(() => {
    if (speechRecognizer) {
      if (isListening) {
        speechRecognizer.startContinuousRecognitionAsync();
      } else {
        speechRecognizer.stopContinuousRecognitionAsync();
      }
    }
  }, [speechRecognizer, isListening]);

  // Function to clear the results and recognized entities
  const clearResult = () => {
    setAnalizeDisabled(true)
    finalText = '';
    setResult('');
    setName('')
    setProfesion('')
    setAge('')
    setLocation('')
    setAddress('')
    setTelephone('')
    setDateTime('')
    setEmail('')
    setAreasOfInterest('')
    setGoals('')
    setOtherType('')
    AnalyzeResult();
  };

  // useRef to keep track of previous results for text analysis
  const previousResultRef = useRef();

  // Update the ref whenever the 'result' state changes
  useEffect(() => {
    previousResultRef.current = result;
  }, [result]);

  // Function to analyze the recognized text and extract entities

  const AnalyzeResult = async () => {

    if (isAnalysisInProgress) {
      return; // Analysis is already in progress, no need to trigger another one
    }
    const startTime = performance.now();
    isAnalysisInProgress = true;
    const user_input = previousResultRef.current;
    let response;


    try {
      response = await fetch(`https://api.openai.com/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openai_apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo-16k-0613",
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
          temperature: 0.2,
          max_tokens: 200,
        }),
      });




      const data = await response.json();

      console.log(data)
      const resultadoString = data["choices"][0]["message"]["content"]

      if (isValidResponse(resultadoString) && user_input != "") {
        const resultado = JSON.parse(resultadoString);


        const fieldMappings = [
          { key: "Names", setter: setName },
          { key: "Professions", setter: setProfesion },
          { key: "Ages", setter: setAge },
          { key: "Locations", setter: setLocation },
          { key: "Address", setter: setAddress },
          { key: "Dates", setter: setDateTime },
          { key: "Phone_numbers", setter: setTelephone },
          { key: "Emails", setter: setEmail },
          { key: "Areas_of_interest", setter: setAreasOfInterest },
          { key: "Goals", setter: setGoals },
          { key: "Other", setter: setOtherType },
        ];

        fieldMappings.forEach(({ key, setter }) => {
          const value = resultado[key];
          if (value && !isMissingValue(value)) {
            setter((prevValues) => {
              const newValues = Array.isArray(value)
                ? value.map((v) => sanitizeValue(v))
                : [sanitizeValue(value)];
              return new Set([...prevValues, ...newValues]);
            });
          }
        });

        function isMissingValue(value) {
          const lowerValue = value.toString().toLowerCase();
          return lowerValue === 'none' || lowerValue === 'unknown' || lowerValue === 'not provided';
        }

        function sanitizeValue(value) {
          return typeof value === 'string' ? value.toLowerCase() : value;
        }

        isAnalysisInProgress = false;
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        console.log(`Processing time: ${processingTime} ms`);
      }
    }

    catch (error) {
      console.error("Error parsing JSON:", error);
      isAnalysisInProgress = false;
    }
  }
  function isValidResponse(response) {
    // Add any criteria to check if the response is valid JSON
    // For example, you can check if it starts with "{"
    return response.trim().startsWith("{");
  }
  // Function to perform text-to-speech synthesis
  const textToSpeech = () => {
    setTextToSpeechDisabled(true);

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    speechConfig.speechSynthesisLanguage = languageSelect;
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      inputText,
      (result) => {
        setTextToSpeechDisabled(false);
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          // setResult(`synthesis finished for "${inputText}".\n`);
        } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
          setResult(`synthesis failed. Error detail: ${result.errorDetails}\n`);
        }
        window.console.log(result);
        synthesizer.close();
      },
      (err) => {
        setTextToSpeechDisabled(false);
        setResult(`Error: ${err}\n`);
        window.console.log(err);
        synthesizer.close();
      }
    );

    setSynthesizer(synthesizer);
  };

  // Render the app's UI
  return (
    <div className="container">
      <h1 className="text-center mt-5">Azure Speech Recognition - GPT</h1>
      <div className="row justify-content-center mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="textToSpeech">Text to Speech:</label>
                <textarea
                  id="text_to_speech"
                  className="form-control"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              </div>
              <div className="text-center">
                <button
                  id="speakButton"
                  className="btn btn-success"
                  onClick={textToSpeech}
                  disabled={textToSpeechDisabled}
                >
                  Speak
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="languageSelect">Select Language:</label>
                <select
                  id="languageSelect"
                  className="form-control"
                  value={languageSelect}
                  onChange={(e) => setLanguageSelect(e.target.value)}
                >
                  <option value="en-US">English</option>
                  <option value="es-ES">Spanish</option>
                </select>
              </div>
              <div className="text-center">
                <button
                  id="startButton"
                  className="btn btn-primary"
                  onClick={startRecognition}
                  disabled={startRecognitionDisabled}
                >
                  Start Listening
                </button>
                <button
                  id="stopButton"
                  className="btn btn-secondary"
                  onClick={stopRecognition}
                  disabled={stopRecognitionDisabled}
                >
                  Stop Listening
                </button>
                <button
                  id="clearButton"
                  className="btn btn-danger"
                  onClick={clearResult}
                  disabled={cleanDisabled}
                >
                  Clear Result
                </button>

              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row justify-content-center mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="form-group">
              <textarea id="result" className="form-control" value={result} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Read-only cells for name, age, and address */}
      <div className="row justify-content-center mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              {/* Example displaying recognized names */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Name:</label>
                <span>{Array.from(name).join(", ")}</span>
              </div>

              {/* Example displaying recognized person type */}
              <div className="form-group">
                <label style={{ width: '120px' }}>profession:</label>
                <span>{Array.from(Profesion).join(", ")}</span>
              </div>

              {/* Example displaying recognized ages */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Age:</label>
                <span>{Array.from(age).join(", ")}</span>
              </div>

              {/* Example displaying recognized addresses */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Location:</label>
                <span>{Array.from(location).join(", ")}</span>
              </div>

              <div className="form-group">
                <label style={{ width: '120px' }}>Addresses:</label>
                <span>{Array.from(address).join(", ")}</span>
              </div>

              {/* Example displaying recognized dates */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Date:</label>
                <span>{Array.from(dateTime).join(", ")}</span>
              </div>

              {/* Example displaying recognized phone numbers */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Phone Numbers:</label>
                <span>{Array.from(telephone).join(", ")}</span>
              </div>
              {/* Example displaying recognized phone numbers */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Email:</label>
                <span>{Array.from(Email).join(", ")}</span>
              </div>
              {/* Example displaying recognized phone numbers */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Areas of interest:</label>
                <span>{Array.from(AreasOfInterest).join(", ")}</span>
              </div>
              <div className="form-group">
                <label style={{ width: '120px' }}>goals:</label>
                <span>{Array.from(Goals).join(", ")}</span>
              </div>

              {/* Example displaying other recognized types */}
              <div className="form-group">
                <label style={{ width: '120px' }}>Other:</label>
                <span>{Array.from(otherType).join(", ")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
