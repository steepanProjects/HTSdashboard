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
        progressPercentage: summary.progressPercentage,
        aiDependencyDetected: summary.aiDependencyDetected,
      },
    });

    console.log(`✅ Saved batch summary: ${summary.progressPercentage}% progress`);
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
