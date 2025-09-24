import * as pdfjsLib from 'pdfjs-dist';

interface RenderTask {
  id: string;
  pdfPage: pdfjsLib.PDFPageProxy;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  viewport: pdfjsLib.PageViewport;
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

class PDFRenderQueue {
  private queue: RenderTask[] = [];
  private isProcessing = false;
  private currentTask: any = null;

  async addRenderTask(
    id: string,
    pdfPage: pdfjsLib.PDFPageProxy,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    viewport: pdfjsLib.PageViewport
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.filter(task => task.id !== id);
      
      const task: RenderTask = {
        id,
        pdfPage,
        canvas,
        context,
        viewport,
        resolve,
        reject,
      };

      this.queue.push(task);
      this.processQueue();
    });
  }

  cancelTask(id: string): void {
    const taskIndex = this.queue.findIndex(task => task.id === id);
    if (taskIndex !== -1) {
      const task = this.queue[taskIndex];
      this.queue.splice(taskIndex, 1);
      task.reject(new Error('Task cancelled'));
    }

    if (this.currentTask && this.currentTask.id === id) {
      try {
        this.currentTask.renderTask?.cancel();
      } catch (e) {
      }
      this.currentTask = null;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      
      try {
        if (!task.canvas.isConnected) {
          task.reject(new Error('Canvas is no longer in DOM'));
          continue;
        }

        this.currentTask = {
          id: task.id,
          renderTask: null,
        };

        const renderContext = {
          canvasContext: task.context,
          viewport: task.viewport,
          canvas: task.canvas,
        };

        this.currentTask.renderTask = task.pdfPage.render(renderContext);
        await this.currentTask.renderTask.promise;
        
        this.currentTask = null;
        task.resolve();
      } catch (error) {
        this.currentTask = null;
        
        if ((error as any)?.name === 'RenderingCancelledException') {
          task.reject(new Error('Rendering cancelled'));
        } else {
          task.reject(error);
        }
      }
    }

    this.isProcessing = false;
  }

  clear(): void {
    if (this.currentTask?.renderTask) {
      try {
        this.currentTask.renderTask.cancel();
      } catch (e) {
      }
    }

    this.queue.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });

    this.queue = [];
    this.currentTask = null;
    this.isProcessing = false;
  }
}

export const pdfRenderQueue = new PDFRenderQueue();
