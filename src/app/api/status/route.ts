import { NextRequest, NextResponse } from 'next/server';
import { queue } from '@/lib/queue';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  const status = queue.getStatus();
  
  if (userId) {
    const userBatch = queue.getUserBatch(userId);
    return NextResponse.json({
      ...status,
      userBatch: {
        userId,
        count: userBatch.length,
        analyses: userBatch,
      },
    });
  }

  return NextResponse.json(status);
}
