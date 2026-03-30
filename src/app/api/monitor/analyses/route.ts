import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId');
  
  if (!teamId) {
    return NextResponse.json({ error: 'teamId required' }, { status: 400 });
  }

  const analyses = await prisma.imageAnalysis.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      member: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json(analyses);
}
