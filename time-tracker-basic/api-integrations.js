// API Integrations for TaskFlow Pro
(function() {
  'use strict';

  // Configuration for API integrations
  const API_CONFIG = {
    googleTranslate: {
      apiKey: '', // Will be set by user
      baseUrl: 'https://translation.googleapis.com/language/translate/v2'
    },
    googleCalendar: {
      apiKey: '', // Will be set by user
      clientId: '', // Will be set by user
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      scopes: 'https://www.googleapis.com/auth/calendar'
    },
    openai: {
      apiKey: '', // Will be set by user
      baseUrl: 'https://api.openai.com/v1'
    },
    pdfOcr: {
      // Using a free OCR service - can be replaced with Google Vision API or other services
      baseUrl: 'https://api.ocr.space/parse/image',
      apiKey: '' // Will be set by user
    }
  };

  // OpenAI-Powered Translation (replaces Google Translate)
  window.TaskFlowTranslate = {
    async translateText(text, targetLanguage = 'en', sourceLanguage = 'auto') {
      // Use OpenAI instead of Google Translate
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      return await window.TaskFlowAI.translate(text, targetLanguage, sourceLanguage);
    },

    async translateDocument(file, targetLanguage = 'en') {
      // First extract text from document using OpenAI OCR, then translate
      const extractedText = await window.TaskFlowOCR.extractTextFromFile(file);
      return await this.translateText(extractedText, targetLanguage);
    },

    setApiKey(apiKey) {
      // Redirect to OpenAI API key setting
      window.TaskFlowAI.setApiKey(apiKey);
    },

    getSupportedLanguages() {
      // Use OpenAI's supported languages
      return window.TaskFlowAI.getSupportedLanguages();
    },

    isConfigured() {
      return window.TaskFlowAI.isConfigured();
    }
  };

  // Google Calendar API Integration
  window.TaskFlowCalendar = {
    isInitialized: false,
    gapi: null,

    async initialize() {
      if (this.isInitialized) return;

      return new Promise((resolve, reject) => {
        // Load Google API
        if (!window.gapi) {
          const script = document.createElement('script');
          script.src = 'https://apis.google.com/js/api.js';
          script.onload = () => {
            window.gapi.load('client:auth2', () => {
              this.gapi = window.gapi;
              resolve();
            });
          };
          script.onerror = reject;
          document.head.appendChild(script);
        } else {
          this.gapi = window.gapi;
          resolve();
        }
      });
    },

    async authenticate() {
      if (!this.gapi) {
        await this.initialize();
      }

      if (!API_CONFIG.googleCalendar.clientId) {
        throw new Error('Google Calendar client ID not configured');
      }

      try {
        await this.gapi.client.init({
          apiKey: API_CONFIG.googleCalendar.apiKey,
          clientId: API_CONFIG.googleCalendar.clientId,
          discoveryDocs: API_CONFIG.googleCalendar.discoveryDocs,
          scope: API_CONFIG.googleCalendar.scopes
        });

        const authInstance = this.gapi.auth2.getAuthInstance();
        const user = await authInstance.signIn();
        
        this.isInitialized = true;
        return user;
      } catch (error) {
        console.error('Calendar authentication error:', error);
        throw error;
      }
    },

    async createEvent(eventDetails) {
      if (!this.isInitialized) {
        await this.authenticate();
      }

      try {
        const event = {
          summary: eventDetails.title,
          description: eventDetails.description || '',
          start: {
            dateTime: eventDetails.startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: eventDetails.endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          attendees: eventDetails.attendees || [],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 10 }
            ]
          }
        };

        const response = await this.gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: event
        });

        return response.result;
      } catch (error) {
        console.error('Calendar event creation error:', error);
        throw error;
      }
    },

    async createMeetingFromTask(task, duration = 60) {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const eventDetails = {
        title: `Meeting: ${task.name}`,
        description: task.description || '',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      return await this.createEvent(eventDetails);
    },

    setCredentials(apiKey, clientId) {
      API_CONFIG.googleCalendar.apiKey = apiKey;
      API_CONFIG.googleCalendar.clientId = clientId;
      localStorage.setItem('taskflow_calendar_api_key', apiKey);
      localStorage.setItem('taskflow_calendar_client_id', clientId);
    }
  };

  // OpenAI API Integration
  window.TaskFlowAI = {
    // Translation using OpenAI
    async translate(text, targetLanguage, sourceLanguage = 'auto') {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      const languageNames = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese (Simplified)',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'bn': 'Bengali',
        'ur': 'Urdu',
        'nl': 'Dutch',
        'pl': 'Polish',
        'tr': 'Turkish',
        'vi': 'Vietnamese',
        'th': 'Thai',
        'id': 'Indonesian'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;
      const sourceLangName = sourceLanguage === 'auto' ? 'the source language' : (languageNames[sourceLanguage] || sourceLanguage);

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Preserve the tone, style, and formatting. Return ONLY the translated text without any explanations or notes.`
              },
              {
                role: 'user',
                content: text
              }
            ],
            max_tokens: 1000,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Please try again in a few minutes or upgrade your OpenAI account.');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('OpenAI translation error:', error);
        throw error;
      }
    },

    async enhanceTaskDescription(taskText) {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a task management assistant. Enhance task descriptions to be more specific and actionable.'
              },
              {
                role: 'user',
                content: `Please enhance this task description: "${taskText}"`
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Handle rate limiting
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Please try again in a few minutes or upgrade your OpenAI account.');
          }
          
          // Handle authentication errors
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
      }
    },

    async extractTasksFromText(text) {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a task extraction assistant. Extract actionable tasks from text and return them as a JSON array with name, description, and priority fields.'
              },
              {
                role: 'user',
                content: `Extract tasks from this text: "${text}"`
              }
            ],
            max_tokens: 500,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Please try again in a few minutes or upgrade your OpenAI account.');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const extractedText = data.choices[0].message.content.trim();
        
        try {
          return JSON.parse(extractedText);
        } catch (parseError) {
          // If JSON parsing fails, return a simple task
          return [{
            name: extractedText,
            description: 'AI-extracted task',
            priority: 'medium'
          }];
        }
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
      }
    },

    async generateTaskSuggestions(context) {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a productivity assistant. Suggest relevant tasks based on the given context.'
              },
              {
                role: 'user',
                content: `Based on this context: "${context}", suggest 3-5 relevant tasks I should consider.`
              }
            ],
            max_tokens: 300,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Please try again in a few minutes or upgrade your OpenAI account.');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
      } catch (error) {
        console.error('OpenAI API error:', error);
        throw error;
      }
    },

    setApiKey(apiKey) {
      API_CONFIG.openai.apiKey = apiKey;
      localStorage.setItem('taskflow_openai_api_key', apiKey);
    },

    // Check if API key is configured
    isConfigured() {
      return !!API_CONFIG.openai.apiKey && API_CONFIG.openai.apiKey.length > 0;
    },

    // Get API key status (masked)
    getKeyStatus() {
      if (!API_CONFIG.openai.apiKey) {
        return 'Not configured';
      }
      const key = API_CONFIG.openai.apiKey;
      return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    },

    // Get supported languages for translation
    getSupportedLanguages() {
      return [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
        { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
        { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
        { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
        { code: 'pl', name: 'Polish', flag: '🇵🇱' },
        { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
        { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
        { code: 'th', name: 'Thai', flag: '🇹🇭' },
        { code: 'id', name: 'Indonesian', flag: '🇮🇩' }
      ];
    },

    // Smart Calendar Event Generation using OpenAI
    async generateCalendarEvent(taskName, taskDescription = '') {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a smart calendar assistant. Generate a calendar event based on the task information. Return a JSON object with title, description, duration (in minutes), and suggested_time (relative to now, like "in 1 hour" or "tomorrow at 9am").'
              },
              {
                role: 'user',
                content: `Create a calendar event for this task:\nTitle: ${taskName}\nDescription: ${taskDescription}`
              }
            ],
            max_tokens: 300,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Please try again in a few minutes.');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Please check your API key in Settings.');
          }
          
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const eventText = data.choices[0].message.content.trim();
        
        try {
          return JSON.parse(eventText);
        } catch (parseError) {
          // Fallback if JSON parsing fails
          return {
            title: `Meeting: ${taskName}`,
            description: taskDescription || 'Generated from TaskFlow task',
            duration: 60,
            suggested_time: 'in 1 hour'
          };
        }
      } catch (error) {
        console.error('OpenAI calendar generation error:', error);
        throw error;
      }
    },

    // Smart Task Analysis and Suggestions
    async analyzeTask(taskName, taskDescription = '') {
      if (!API_CONFIG.openai.apiKey) {
        throw new Error('OpenAI API key not configured. Please add your API key in Settings.');
      }

      try {
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a productivity expert. Analyze the task and provide insights including estimated time, priority level, suggested subtasks, and tips for completion. Return a JSON object.'
              },
              {
                role: 'user',
                content: `Analyze this task:\nTitle: ${taskName}\nDescription: ${taskDescription}`
              }
            ],
            max_tokens: 500,
            temperature: 0.4
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const analysisText = data.choices[0].message.content.trim();
        
        try {
          return JSON.parse(analysisText);
        } catch (parseError) {
          return {
            estimated_time: '30-60 minutes',
            priority: 'medium',
            subtasks: ['Break down the task', 'Plan the approach', 'Execute the work'],
            tips: ['Focus on one thing at a time', 'Take breaks when needed']
          };
        }
      } catch (error) {
        console.error('OpenAI task analysis error:', error);
        throw error;
      }
    }
  };

  // OpenAI Vision OCR Integration (replaces third-party OCR)
  window.TaskFlowOCR = {
    async extractTextFromFile(file) {
      // Use OpenAI Vision API for OCR
      if (!API_CONFIG.openai.apiKey) {
        console.log('OpenAI API key not configured, falling back to Tesseract.js');
        return await this.extractTextWithTesseract(file);
      }

      try {
        // Convert file to base64
        const base64 = await this.fileToBase64(file);
        
        const response = await fetch(`${API_CONFIG.openai.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.openai.apiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4-vision-preview',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Extract all text from this image. Return only the extracted text without any explanations or formatting. If there are multiple columns or sections, preserve the reading order.'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: base64
                    }
                  }
                ]
              }
            ],
            max_tokens: 2000,
            temperature: 0.1
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            throw new Error('OpenAI rate limit reached. Falling back to Tesseract.js');
          }
          
          if (response.status === 401) {
            throw new Error('Invalid OpenAI API key. Falling back to Tesseract.js');
          }
          
          throw new Error(errorData.error?.message || `OpenAI Vision API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
        
      } catch (error) {
        console.error('OpenAI Vision OCR error:', error);
        console.log('Falling back to Tesseract.js');
        return await this.extractTextWithTesseract(file);
      }
    },

    async fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    async extractTextWithTesseract(file) {
      // Load Tesseract.js dynamically as fallback
      if (!window.Tesseract) {
        await this.loadTesseract();
      }

      try {
        console.log('Using Tesseract.js for OCR...');
        const { data: { text } } = await window.Tesseract.recognize(file, 'eng', {
          logger: m => console.log('Tesseract:', m)
        });
        return text;
      } catch (error) {
        console.error('Tesseract OCR error:', error);
        throw new Error('Text extraction failed with both OpenAI Vision and Tesseract.js');
      }
    },

    async loadTesseract() {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    },

    setApiKey(apiKey) {
      // Redirect to OpenAI API key setting
      window.TaskFlowAI.setApiKey(apiKey);
    },

    isConfigured() {
      return window.TaskFlowAI.isConfigured();
    }
  };

  // Load saved API keys on initialization
  function loadSavedApiKeys() {
    API_CONFIG.googleTranslate.apiKey = localStorage.getItem('taskflow_translate_api_key') || '';
    API_CONFIG.googleCalendar.apiKey = localStorage.getItem('taskflow_calendar_api_key') || '';
    API_CONFIG.googleCalendar.clientId = localStorage.getItem('taskflow_calendar_client_id') || '';
    API_CONFIG.openai.apiKey = localStorage.getItem('taskflow_openai_api_key') || '';
    API_CONFIG.pdfOcr.apiKey = localStorage.getItem('taskflow_ocr_api_key') || '';
  }

  // Initialize on load
  loadSavedApiKeys();

  // Export configuration for settings
  window.TaskFlowAPIConfig = {
    getConfig: () => API_CONFIG,
    setConfig: (config) => {
      Object.assign(API_CONFIG, config);
    }
  };

})();
