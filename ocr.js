// API route for OpenAI Vision OCR
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, apiKey } = req.body;

  // Validate required fields
  if (!image || !apiKey) {
    return res.status(400).json({ error: 'Missing required fields: image and apiKey' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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
                  url: image
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
        return res.status(429).json({ error: 'OpenAI rate limit reached. Please try again in a few minutes.' });
      }

      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid OpenAI API key.' });
      }

      return res.status(response.status).json({
        error: errorData.error?.message || `OpenAI Vision API error: ${response.statusText}`
      });
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content.trim();

    return res.status(200).json({ text: extractedText });

  } catch (error) {
    console.error('OCR API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
