// API route for OpenAI calendar event generation
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { taskName, taskDescription = '', apiKey } = req.body;

  // Validate required fields
  if (!taskName || !apiKey) {
    return res.status(400).json({ error: 'Missing required fields: taskName and apiKey' });
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
    const eventText = data.choices[0].message.content.trim();

    try {
      const eventData = JSON.parse(eventText);
      return res.status(200).json(eventData);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return res.status(200).json({
        title: `Meeting: ${taskName}`,
        description: taskDescription || 'Generated from TaskFlow task',
        duration: 60,
        suggested_time: 'in 1 hour'
      });
    }

  } catch (error) {
    console.error('Calendar generation API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
