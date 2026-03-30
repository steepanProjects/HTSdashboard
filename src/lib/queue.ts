import { IncomingData, QueueItem, ImageAnalysis } from '@/types';
import { analyzeImage } from './groq';
import { prisma } from './prisma';

class ProcessingQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private userBatches: Map<string, ImageAnalysis[]> = new Map();

  async add(data: IncomingData): Promise<string> {
    const id = `${data.userId}-${data.timestamp}-${Date.now()}`;
    const item: QueueItem = {
      id,
      data,
      status: 'pending',
      createdAt: new Date(),
    };
    
    this.queue.push(item);
    
    if (!this.processing) {
      this.processNext();
    }
    
    return id;
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const item = this.queue.find(i => i.status === 'pending');
    
    if (!item) {
      this.processing = false;
      return;
    }
    
    item.status = 'processing';
    
    try {
      const result = await analyzeImage(item.data);
      item.result = result;
      item.status = 'completed';
      item.processedAt = new Date();
      
      // Save individual analysis immediately to DB
      await prisma.imageAnalysis.create({
        data: {
          userId: result.userId,
          teamId: result.teamId,
          timestamp: new Date(result.timestamp),
          countCycle: result.countCycle,
          description: result.description,
          aiDependencyFlag: result.aiDependencyFlag,
          confidence: result.confidence,
        },
      });
      
      // Store in batch
      const key = `${result.userId}`;
      const batch = this.userBatches.get(key) || [];
      batch.push(result);
      this.userBatches.set(key, batch);
      
      console.log(`📊 User ${result.userId} batch: ${batch.length}/6 analyses collected`);
      
      // Check if we have 6 analyses for this user (3 minutes at 30-second intervals)
      if (batch.length >= 6) {
        console.log(`🎯 Batch complete! Processing ${batch.length} analyses for user ${result.userId}`);
        await this.processBatch(result.userId, result.teamId, batch);
        this.userBatches.set(key, []); // Reset batch
      }
      
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Processing error:', error);
    }
    
    this.processing = false;
    this.processNext(); // Process next item
  }

  private async processBatch(userId: string, teamId: string, analyses: ImageAnalysis[]) {
    console.log(`📦 Processing batch for user ${userId}, team ${teamId} with ${analyses.length} analyses`);
    
    // Get team project details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { 
        projectTitle: true, 
        projectDescription: true,
        liveSummary: true,
      },
    });

    if (!team) {
      console.error(`Team ${teamId} not found`);
      return;
    }

    console.log(`📋 Team found: ${team.projectTitle}, current live summary length: ${team.liveSummary?.length || 0}`);

    // Import here to avoid circular dependency
    const { summarizeBatch, consolidateLiveSummary } = await import('./groq');
    const { saveBatchSummary } = await import('./db');
    
    console.log(`🤖 Starting batch summarization...`);
    const summary = await summarizeBatch(
      userId,
      teamId,
      analyses,
      team.projectTitle,
      team.projectDescription
    );
    console.log(`✅ Batch summary created with progress: ${summary.progressPercentage}%`);
    
    await saveBatchSummary(summary);
    console.log(`💾 Batch summary saved to database`);

    // Consolidate the live summary
    try {
      console.log(`🔄 Consolidating live summary for team ${teamId}...`);
      const batchSummaryText = `GPT Analysis: ${summary.gptSummary}\nLlama Analysis: ${summary.llamaSummary}\nProgress: ${summary.progressPercentage}%`;
      const newLiveSummary = await consolidateLiveSummary(
        team.liveSummary,
        batchSummaryText,
        team.projectTitle,
        team.projectDescription
      );

      // Update team's live summary
      await prisma.team.update({
        where: { id: teamId },
        data: { liveSummary: newLiveSummary },
      });

      console.log(`✅ Updated live summary for team ${teamId} (length: ${newLiveSummary.length} chars)`);
    } catch (error) {
      console.error(`❌ Failed to update live summary for team ${teamId}:`, error);
      // Don't throw - batch summary was saved successfully, just log the error
    }
  }

  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === 'pending').length,
      processing: this.queue.filter(i => i.status === 'processing').length,
      completed: this.queue.filter(i => i.status === 'completed').length,
      failed: this.queue.filter(i => i.status === 'failed').length,
    };
  }

  getUserBatch(userId: string): ImageAnalysis[] {
    return this.userBatches.get(userId) || [];
  }
}

export const queue = new ProcessingQueue();
