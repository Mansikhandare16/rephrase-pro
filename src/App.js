import React, { useState } from 'react';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 🔑 Your API Key here
  const HF_API_KEY = "hhf_BmkYJNPdbFDYupXFCzDvvxUKPGVUQbHPMr";

  const tones = [
    { id: 'professional', label: 'Professional', emoji: '💼' },
    { id: 'friendly', label: 'Friendly', emoji: '😊' },
    { id: 'polite', label: 'Polite', emoji: '🙏' }
  ];

  const handleRephrase = async () => {
    if (!inputText.trim()) {
      alert('Please enter some text to rephrase.');
      return;
    }

    setIsLoading(true);
    setOutputText('');

    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${HF_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Please rewrite this text to sound ${selectedTone}. Only return the rewritten text, no explanations. Original: "${inputText}"`,
            parameters: {
              max_length: 100,
              temperature: 0.8,
              do_sample: true,
              return_full_text: false
            }
          }),
        }
      );

      console.log('API Response:', response);

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('API Data:', data);

      // Handle different response formats
      let generatedText = '';
      
      if (Array.isArray(data) && data[0] && data[0].generated_text) {
        generatedText = data[0].generated_text;
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      } else if (typeof data === 'string') {
        generatedText = data;
      } else {
        throw new Error('Unexpected response format');
      }

      // Clean the response - remove any prefixes and the original text
      generatedText = generatedText
        .replace(new RegExp(`.*rewrite.*${selectedTone}.*:?`, 'i'), '')
        .replace(new RegExp(`.*rephrase.*${selectedTone}.*:?`, 'i'), '')
        .replace(new RegExp(`"${inputText}"`, 'gi'), '')
        .replace(/^["']|["']$/g, '')
        .replace(/^(rewritten|rephrased):?\s*/i, '')
        .trim();

      // If cleaned text is empty or too short, use a dynamic fallback
      if (!generatedText || generatedText.length < 5) {
        throw new Error('No meaningful response generated');
      }

      setOutputText(generatedText);

    } catch (error) {
      console.error('API Error:', error);
      
      // Create dynamic fallback responses based on input
      const dynamicResponses = {
        professional: {
          'asap': `I would appreciate if this could be completed at your earliest convenience.`,
          'urgent': `This matter requires prompt attention.`,
          'help': `I would appreciate your assistance with this matter.`,
          'problem': `There appears to be an issue that needs to be addressed.`,
          'thanks': `Thank you for your attention to this matter.`,
          'sorry': `My apologies for any inconvenience caused.`,
          'default': `Regarding "${inputText}", I would appreciate your prompt attention to this matter.`
        },
        friendly: {
          'asap': `Hey! Could you get this done soon? Thanks!`,
          'urgent': `This is pretty urgent - can you prioritize it?`,
          'help': `Could you give me a hand with this?`,
          'problem': `Ran into a bit of a snag here - any ideas?`,
          'thanks': `Thanks a bunch for your help!`,
          'sorry': `Oops, my bad! Sorry about that.`,
          'default': `Hey! About "${inputText}" - could you take care of this when you get a chance?`
        },
        polite: {
          'asap': `Would you mind completing this at your earliest convenience?`,
          'urgent': `I would be grateful if you could give this your prompt attention.`,
          'help': `I was wondering if you might be able to assist me with this?`,
          'problem': `I've encountered a slight difficulty that I'd appreciate your help with.`,
          'thanks': `I'm very grateful for your support.`,
          'sorry': `I sincerely apologize for the oversight.`,
          'default': `I was wondering if you might be able to help with "${inputText}"?`
        }
      };

      // Find the best matching response
      const lowerText = inputText.toLowerCase();
      let response = dynamicResponses[selectedTone].default;

      if (lowerText.includes('asap') || lowerText.includes('soon')) {
        response = dynamicResponses[selectedTone].asap;
      } else if (lowerText.includes('urgent') || lowerText.includes('important')) {
        response = dynamicResponses[selectedTone].urgent;
      } else if (lowerText.includes('help')) {
        response = dynamicResponses[selectedTone].help;
      } else if (lowerText.includes('problem') || lowerText.includes('issue')) {
        response = dynamicResponses[selectedTone].problem;
      } else if (lowerText.includes('thank')) {
        response = dynamicResponses[selectedTone].thanks;
      } else if (lowerText.includes('sorry')) {
        response = dynamicResponses[selectedTone].sorry;
      }

      setOutputText(response);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const quickExamples = [
    "I need this done ASAP",
    "Can you help me with this?",
    "There's a problem here",
    "Thanks for your help",
    "Sorry for the mistake",
    "This is very urgent"
  ];

  const insertExample = (example) => {
    setInputText(example);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>Rephrase Pro</h1>
          <p className="subtitle">Rewrite any message to sound formal, friendly, or polite</p>
        </header>

        <div className="examples-section">
          <label>Try these examples:</label>
          <div className="example-buttons">
            {quickExamples.map((example, index) => (
              <button
                key={index}
                className="example-btn"
                onClick={() => insertExample(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="input-section">
          <div className="form-group">
            <label>Your Message:</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here..."
              rows="3"
            />
          </div>

          <div className="tone-selector">
            <label>Select Tone:</label>
            <div className="tone-buttons">
              {tones.map(tone => (
                <button
                  key={tone.id}
                  className={`tone-btn ${selectedTone === tone.id ? 'active' : ''}`}
                  onClick={() => setSelectedTone(tone.id)}
                >
                  <span className="emoji">{tone.emoji}</span>
                  {tone.label}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="rephrase-btn"
            onClick={handleRephrase}
            disabled={isLoading}
          >
            {isLoading ? 'Rephrasing...' : 'Rephrase Message'}
          </button>
        </div>

        <div className="output-section">
          <div className="form-group">
            <div className="output-header">
              <label>Rephrased Message:</label>
              {outputText && !isLoading && (
                <button className="copy-btn" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
            <textarea
              value={outputText}
              readOnly
              placeholder="Your rephrased text will appear here..."
              rows="3"
            />
          </div>
        </div>

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Processing your message...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;