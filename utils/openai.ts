
import OpenAI from 'openai';

const apiKey = process.env.AIHUBMIX_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('AIHUBMIX_API_KEY/OPENAI_API_KEY is not set.');
}

export const openai = new OpenAI({
    apiKey: apiKey || 'mock-key',
    baseURL: "https://aihubmix.com/v1", // Using AiHubMix
    dangerouslyAllowBrowser: false,
});

export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.replace(/\n/g, ' '),
        });
        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        // Fallback or throw? For now throw to be caught by route
        throw error;
    }
}

export async function generateSearchResults(query: string): Promise<any[]> {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a search engine for a vintage market and consignment shop finder app called "Tenbyten". 
Return a JSON object with a "results" array containing 3-5 distinct items relevant to the user's query.
Each item must have:
- id: string
- title: string (name of market or shop)
- description: string (2-3 sentences)
- type: "MARKET" or "CONSIGNMENT" (strictly one of these)
- similarity: number (between 0.7 and 0.99)

Example format:
{
  "results": [
    { "id": "1", "title": "Example Market", "description": "...", "type": "MARKET", "similarity": 0.95 }
  ]
}
Return ONLY valid JSON. nothing else.`
                },
                {
                    role: "user",
                    content: query
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        if (!content) return [];

        const parsed = JSON.parse(content);
        return parsed.results || [];
    } catch (error) {
        console.error('Error generating search results:', error);
        return [];
    }
}
