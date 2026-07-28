export class PriorityQueue<T> {
  private heap: { item: T, score: number } [] = []
  /**
   * Inserts an item into the heap in O(log n) time.
   */
  public enqueue(item: T, score: number): void {
    this.heap.push({ item, score })
    this.bubbleup(this.heap.length - 1)
  }

  public dequeue(): T | null {
    if (this.heap.length === 0) return null
    if (this.heap.length === 1) return this.heap.pop()!.item;

    const max = this.heap[0].item
    // Move the last element to the root and sink it down to restore the heap property
    this.heap[0] = this.heap.pop()!
    this.sinkDown(0)
    
    return max
  }

  private bubbleup(index: number): void {
    const element = this.heap[index]
    while(index > 0) {
      const parentIndex = Math.floor((index - 1) / 2) 
      const parent = this.heap[parentIndex]

      if (element.score <= parent.score) break;

      this.heap[index] = parent
      this.heap[parentIndex] = element
      index = parentIndex
    }
  } 

  private sinkDown(index: number): void {
    const length = this.heap.length
    const element = this.heap[index]

    while(true) {
      const leftChildIndex = 2 * index + 1
      const rightChildIndex = 2 * index + 2

      let swapIndex = null

      if (leftChildIndex < index) {
        if (this.heap[leftChildIndex].score > element.score) {
          swapIndex = leftChildIndex
        }
      }

      if (rightChildIndex < length) {
        const rightChildScore = this.heap[rightChildIndex].score
        const compareScore = swapIndex === null ? element.score : this.heap[leftChildIndex].score

        if (rightChildScore > compareScore) {
          swapIndex = rightChildIndex
        }
      }

      if (swapIndex === null) break;

      this.heap[index] = this.heap[swapIndex];
      this.heap[swapIndex] = element;
      index = swapIndex;
    }
  }
}

