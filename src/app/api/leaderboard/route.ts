import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all teams with their progress data
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: { id: true, name: true },
        },
        progress: {
          select: {
            meanScore: true,
            progressPercentage: true,
            aiDependencyDetected: true,
          },
        },
      },
    });

    // Calculate statistics for each team
    const leaderboard = teams.map(team => {
      const batches = team.progress;
      const totalBatches = batches.length;
      
      if (totalBatches === 0) {
        return {
          teamId: team.id,
          teamName: team.name,
          projectTitle: team.projectTitle,
          memberCount: team.members.length,
          members: team.members,
          averageScore: 0,
          totalProgress: 0,
          totalBatches: 0,
          aiDependencyRate: 0,
          rank: 0,
        };
      }

      const avgScore = batches.reduce((sum, b) => sum + (b.meanScore || 0), 0) / totalBatches;
      const totalProgress = batches.reduce((sum, b) => sum + (b.progressPercentage || 0), 0);
      const aiFlagged = batches.filter(b => b.aiDependencyDetected).length;
      const aiRate = (aiFlagged / totalBatches) * 100;

      return {
        teamId: team.id,
        teamName: team.name,
        projectTitle: team.projectTitle,
        memberCount: team.members.length,
        members: team.members,
        averageScore: avgScore,
        totalProgress: Math.min(totalProgress, 100),
        totalBatches,
        aiDependencyRate: aiRate,
        rank: 0,
      };
    });

    // Sort by average score (descending) and assign ranks
    leaderboard.sort((a, b) => b.averageScore - a.averageScore);
    leaderboard.forEach((team, index) => {
      team.rank = index + 1;
    });

    return NextResponse.json(leaderboard, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
