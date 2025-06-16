const AI_WEBHOOK_URL = process.env.EXPO_PUBLIC_AI_WEBHOOK_URL!;

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIResponse {
  message: string;
  disclaimer?: string;
  suggestions?: string[];
}

export async function sendMessageToAI(
  message: string,
  userHealthData?: any
): Promise<AIResponse> {
  try {
    const response = await fetch(AI_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userHealthData,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    
    return {
      message: data.message,
      disclaimer: "This AI assistant provides general health information only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical concerns.",
      suggestions: data.suggestions || [],
    };
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw new Error('Unable to connect to AI assistant. Please try again later.');
  }
}