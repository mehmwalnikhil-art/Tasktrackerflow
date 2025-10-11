// API route for OpenAI translation
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLanguage = 'en', sourceLanguage = 'auto', apiKey } = req.body;

  // Validate required fields
  if (!text || !apiKey) {
    return res.status(400).json({ error: 'Missing required fields: text and apiKey' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text to ${targetLanguage}. Only return the translated text without any explanations or additional content.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 429) {
        return res.status(429).json({ error: 'OpenAI rate limit reached. Please try again in a few minutes.' });
      }

      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key.' });
      }

      return res.status(response.status).json({
        error: errorData.error?.message || `OpenAI API error: ${response.statusText}`
      });
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content.trim();

    return res.status(200).json({ translatedText });

  } catch (error) {
    console.error('Translation API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
