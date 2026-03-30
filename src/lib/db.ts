import { prisma } from '@/lib/prisma';
import { BatchSummary } from '@/types';

export async function saveBatchSummary(summary: BatchSummary) {
  try {
    // Save batch summary
    await prisma.teamProgress.create({
      data: {
        teamId: summary.teamId,
        userId: summary.userId,
        startTime: new Date(summary.startTime),
        endTime: new Date(summary.endTime),
        gptSummary: summary.gptSummary,
        gptScore: summary.gptScore,
        llamaSummary: summary.llamaSummary,
        llamaScore: summary.llamaScore,
        meanScore: summary.meanScore,
        aiDependencyDetected: summary.aiDependencyDetected,
      },
    });

    // Save individual analyses
    await prisma.imageAnalysis.createMany({
      data: summary.analyses.map((analysis) => ({
        userId: analysis.userId,
        teamId: analysis.teamId,
        timestamp: new Date(analysis.timestamp),
        countCycle: analysis.countCycle,
        description: analysis.description,
        aiDependencyFlag: analysis.aiDependencyFlag,
        confidence: analysis.confidence,
      })),
    });
  } catch (error) {
    console.error('Error saving batch summary:', error);
    throw error;
  }
}

export async function getTeamProgress(teamId: string) {
  return await prisma.teamProgress.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  });
}
