import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInitialLiveSummary } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { teamId } = await req.json();

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        projectTitle: true,
        projectDescription: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get all batch summaries for this team
    const batches = await prisma.teamProgress.findMany({
      where: { teamId },
      orderBy: { createdAt: 'asc' },
      select: {
        gptSummary: true,
        llamaSummary: true,
        progressPercentage: true,
        startTime: true,
        endTime: true,
      },
    });

    if (batches.length === 0) {
      return NextResponse.json(
        { error: 'No batch summaries found for this team' },
        { status: 404 }
      );
    }

    // Filter out batches with missing summaries
    const validBatches = batches.filter(b => b.gptSummary && b.llamaSummary);

    if (validBatches.length === 0) {
      return NextResponse.json(
        { error: 'No valid batch summaries found' },
        { status: 404 }
      );
    }

    // Generate consolidated summary
    const liveSummary = await generateInitialLiveSummary(
      validBatches.map(b => ({
        gptSummary: b.gptSummary!,
        llamaSummary: b.llamaSummary!,
        progressPercentage: b.progressPercentage || 0,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      team.projectTitle,
      team.projectDescription
    );

    // Update team with new live summary
    await prisma.team.update({
      where: { id: teamId },
      data: { liveSummary },
    });

    console.log(`✅ Regenerated live summary for team ${teamId} from ${validBatches.length} batches`);

    return NextResponse.json({
      success: true,
      liveSummary,
      batchesProcessed: validBatches.length,
    });
  } catch (error) {
    console.error('Error regenerating live summary:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate live summary' },
      { status: 500 }
    );
  }
}
