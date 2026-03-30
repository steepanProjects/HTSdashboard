import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    
    const progress = await prisma.teamProgress.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const grouped = progress.reduce((acc, p) => {
      if (!acc[p.teamId]) acc[p.teamId] = [];
      acc[p.teamId].push(p);
      return acc;
    }, {} as Record<string, typeof progress>);

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
