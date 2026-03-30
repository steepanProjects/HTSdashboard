import { IncomingData, QueueItem, ImageAnalysis } from '@/types';
import { analyzeImage } from './groq';

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
      
      // Store in batch
      const key = `${result.userId}`;
      const batch = this.userBatches.get(key) || [];
      batch.push(result);
      this.userBatches.set(key, batch);
      
      // Check if we have 15 analyses for this user
      if (batch.length >= 15) {
        await this.processBatch(result.userId, result.teamId, batch);
        this.userBatches.set(key, []); // Reset batch
      }
      
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
    }
    
    this.processing = false;
    this.processNext(); // Process next item
  }

  private async processBatch(userId: string, teamId: string, analyses: ImageAnalysis[]) {
    // Import here to avoid circular dependency
    const { summarizeBatch } = await import('./groq');
    const { saveBatchSummary } = await import('./db');
    
    const summary = await summarizeBatch(userId, teamId, analyses);
    await saveBatchSummary(summary);
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
