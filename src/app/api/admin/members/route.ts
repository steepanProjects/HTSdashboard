import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      include: {
        team: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, teamId } = await req.json();

    if (!name || !email || !teamId) {
      return NextResponse.json(
        { error: 'Name, email, and teamId are required' },
        { status: 400 }
      );
    }

    const member = await prisma.member.create({
      data: {
        name,
        email,
        teamId,
      },
      include: {
        team: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error: any) {
    console.error('Error creating member:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    await prisma.member.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}
