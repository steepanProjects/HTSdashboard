import Groq from 'groq-sdk';
import { IncomingData, ImageAnalysis, BatchSummary } from '@/types';
import { SCOUT_SYSTEM_PROMPT, SUMMARIZER_SYSTEM_PROMPT, PROGRESS_CALCULATOR_PROMPT, LIVE_SUMMARY_CONSOLIDATOR_PROMPT } from './prompts';

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

  console.log('📊 Progress calculation result:', progressResult);

  // Ensure we have a valid progress percentage
  let progressPercentage = 0;
  if (progressResult.progressPercentage !== undefined && progressResult.progressPercentage !== null) {
    progressPercentage = Number(progressResult.progressPercentage);
  } else {
    // Fallback: estimate based on mean score (rough approximation)
    progressPercentage = meanScore * 0.02; // 100 score = ~2% progress for 3 minutes
    console.warn('⚠️ No progressPercentage from LLM, using fallback:', progressPercentage);
  }

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
    progressPercentage,
    aiDependencyDetected: avgAiDependency >= 0.5 || gptResult.aiDependencyDetected || llamaResult.aiDependencyDetected,
  };
}


export async function consolidateLiveSummary(
  currentLiveSummary: string | null,
  newBatchSummary: string,
  projectTitle: string,
  projectDescription: string
): Promise<string> {
  const input = `
CURRENT LIVE SUMMARY:
${currentLiveSummary || 'No previous summary - this is the first batch'}

NEW 3-MINUTE BATCH SUMMARY:
${newBatchSummary}
`;

  const response = await groq.chat.completions.create({
    model: process.env.GROQ_LLAMA_MODEL || 'llama-3.1-70b-versatile',
    messages: [
      { role: 'system', content: LIVE_SUMMARY_CONSOLIDATOR_PROMPT(projectTitle, projectDescription) },
      { role: 'user', content: input },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0]?.message?.content || '{}');
  
  console.log('📝 Consolidated live summary generated');
  
  // Format the structured response into a readable summary
  const formattedSummary = formatStructuredSummary(result);
  
  return formattedSummary;
}

function formatStructuredSummary(data: any): string {
  let summary = '';
  
  if (data.overallProgress) {
    summary += `## Overall Progress\n${data.overallProgress}\n\n`;
  }
  
  if (data.keyAccomplishments && data.keyAccomplishments.length > 0) {
    summary += `## Key Accomplishments\n`;
    data.keyAccomplishments.forEach((item: string) => {
      summary += `• ${item}\n`;
    });
    summary += '\n';
  }
  
  if (data.productivityAnalysis) {
    summary += `## Team Productivity Analysis\n`;
    if (data.productivityAnalysis.topPerformers && data.productivityAnalysis.topPerformers.length > 0) {
      summary += `**Top Performers:** ${data.productivityAnalysis.topPerformers.join(', ')}\n\n`;
    }
    if (data.productivityAnalysis.insights) {
      summary += `${data.productivityAnalysis.insights}\n\n`;
    }
  }
  
  if (data.strengths && data.strengths.length > 0) {
    summary += `## Strengths\n`;
    data.strengths.forEach((item: string) => {
      summary += `✓ ${item}\n`;
    });
    summary += '\n';
  }
  
  if (data.concerns && data.concerns.length > 0) {
    summary += `## Concerns & Areas for Improvement\n`;
    data.concerns.forEach((item: string) => {
      summary += `⚠ ${item}\n`;
    });
    summary += '\n';
  }
  
  if (data.currentFocus) {
    summary += `## Current Focus\n${data.currentFocus}\n\n`;
  }
  
  if (data.recommendations && data.recommendations.length > 0) {
    summary += `## Recommendations\n`;
    data.recommendations.forEach((item: string) => {
      summary += `→ ${item}\n`;
    });
  }
  
  return summary.trim();
}


export async function generateInitialLiveSummary(
  batchSummaries: Array<{ gptSummary: string; llamaSummary: string; progressPercentage: number; startTime: Date; endTime: Date }>,
  projectTitle: string,
  projectDescription: string
): Promise<string> {
  if (batchSummaries.length === 0) {
    return '';
  }

  // Consolidate all batch summaries sequentially
  let consolidatedSummary = '';

  for (const batch of batchSummaries) {
    const batchText = `GPT Analysis: ${batch.gptSummary}\nLlama Analysis: ${batch.llamaSummary}\nProgress: ${batch.progressPercentage}%\nTime: ${batch.startTime.toLocaleTimeString()} - ${batch.endTime.toLocaleTimeString()}`;
    
    consolidatedSummary = await consolidateLiveSummary(
      consolidatedSummary || null,
      batchText,
      projectTitle,
      projectDescription
    );
  }

  console.log(`📝 Generated initial live summary from ${batchSummaries.length} batches`);
  return consolidatedSummary;
}
