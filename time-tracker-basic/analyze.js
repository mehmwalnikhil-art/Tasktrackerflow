// API route for OpenAI task analysis
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
    const analysisText = data.choices[0].message.content.trim();

    try {
      const analysisData = JSON.parse(analysisText);
      return res.status(200).json(analysisData);
    } catch (parseError) {
      return res.status(200).json({
        estimated_time: '30-60 minutes',
        priority: 'medium',
        subtasks: ['Break down the task', 'Plan the approach', 'Execute the work'],
        tips: ['Focus on one thing at a time', 'Take breaks when needed']
      });
    }

  } catch (error) {
    console.error('Task analysis API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
