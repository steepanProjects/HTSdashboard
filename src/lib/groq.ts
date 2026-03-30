import Groq from 'groq-sdk';
import { IncomingData, ImageAnalysis, BatchSummary } from '@/types';
import { SCOUT_SYSTEM_PROMPT, SUMMARIZER_SYSTEM_PROMPT, PROGRESS_CALCULATOR_PROMPT } from './prompts';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeImage(data: IncomingData): Promise<ImageAnalysis> {
  const response = await groq.chat.completions.create({
    model: process.env.GROQ_SCOUT_MODEL || 'llama-3.2-90b-vision-preview',
    messages: [
      {
        role: 'system',
        content: SCOUT_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Analyze this developer screenshot and determine what they are doing.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${data.image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');

  return {
    userId: data.userId,
    teamId: data.teamId,
    timestamp: data.timestamp,
    countCycle: data.countCycle,
    description: result.description || '',
    aiDependencyFlag: result.aiDependencyFlag || false,
    confidence: result.confidence || 0,
  };
}

export async function summarizeBatch(
  userId: string,
  teamId: string,
  analyses: ImageAnalysis[],
  projectTitle: string,
  projectDescription: string
): Promise<BatchSummary> {
  const analysisText = analyses.map((a, i) => 
    `[${i + 1}] ${a.timestamp}: ${a.description} (AI flag: ${a.aiDependencyFlag})`
  ).join('\n');

  // Calculate average AI dependency from individual analyses
  const aiFlags = analyses.filter(a => a.aiDependencyFlag).length;
  const avgAiDependency = aiFlags / analyses.length;

  // GPT model summary
  const gptResponse = await groq.chat.completions.create({
    model: process.env.GROQ_GPT_MODEL || 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT(projectTitle, projectDescription) },
      { role: 'user', content: `Analyze these 3 minutes of activity (6 screenshots, 30-second intervals):\n\n${analysisText}` },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const gptResult = JSON.parse(gptResponse.choices[0]?.message?.content || '{}');

  // Llama model summary
  const llamaResponse = await groq.chat.completions.create({
    model: process.env.GROQ_LLAMA_MODEL || 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT(projectTitle, projectDescription) },
      { role: 'user', content: `Analyze these 3 minutes of activity (6 screenshots, 30-second intervals):\n\n${analysisText}` },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const llamaResult = JSON.parse(llamaResponse.choices[0]?.message?.content || '{}');

  const meanScore = (gptResult.progressScore + llamaResult.progressScore) / 2;

  // Calculate progress percentage using both model summaries
  const progressInput = `
GPT Summary: ${gptResult.summary}
GPT Score: ${gptResult.progressScore}

Llama Summary: ${llamaResult.summary}
Llama Score: ${llamaResult.progressScore}

Mean Score: ${meanScore}
AI Dependency Rate: ${(avgAiDependency * 100).toFixed(0)}%`;

  const progressResponse = await groq.chat.completions.create({
    model: process.env.GROQ_LLAMA_MODEL || 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: PROGRESS_CALCULATOR_PROMPT(projectTitle, projectDescription) },
      { role: 'user', content: progressInput },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const progressResult = JSON.parse(progressResponse.choices[0]?.message?.content || '{}');

  return {
    userId,
    teamId,
    startTime: analyses[0].timestamp,
    endTime: analyses[analyses.length - 1].timestamp,
    analyses,
    gptSummary: gptResult.summary,
    gptScore: gptResult.progressScore,
    llamaSummary: llamaResult.summary,
    llamaScore: llamaResult.progressScore,
    meanScore,
    progressPercentage: progressResult.progressPercentage || 0,
    aiDependencyDetected: avgAiDependency >= 0.5 || gptResult.aiDependencyDetected || llamaResult.aiDependencyDetected,
  };
}
