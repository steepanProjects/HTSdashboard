import { NextRequest, NextResponse } from 'next/server';
import { queue } from '@/lib/queue';
import { IncomingData } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const data: IncomingData = await req.json();

    // Validate incoming data
    if (!data.userId || !data.teamId || !data.timestamp || !data.image) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const queueId = await queue.add(data);

    return NextResponse.json({
      success: true,
      queueId,
      message: 'Data queued for processing',
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
