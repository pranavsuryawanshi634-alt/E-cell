// In-memory sliding-window rate limiter for sensitive authentication endpoints

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class MemoryRateLimiter {
  private attempts = new Map<string, RateLimitRecord>();

  /**
   * Check and increment the attempt count for a given key.
   * @param key Unique identifier (e.g. IP + endpoint, or IP + email)
   * @param maxAttempts Max allowed attempts within the window
   * @param windowMs Time window in milliseconds (e.g. 15 minutes)
   * @returns { allowed: boolean, remaining: number, retryAfterSec: number }
   */
  consume(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number; retryAfterSec: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || record.resetAt <= now) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: maxAttempts - 1, retryAfterSec: 0 };
    }

    if (record.count >= maxAttempts) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, retryAfterSec };
    }

    record.count += 1;
    return { allowed: true, remaining: maxAttempts - record.count, retryAfterSec: 0 };
  }

  /**
   * Reset attempts on successful authentication
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Cleanup expired entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (record.resetAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}

export const authRateLimiter = new MemoryRateLimiter();

// Periodically purge expired records every 10 minutes
setInterval(() => {
  authRateLimiter.cleanup();
}, 10 * 60 * 1000).unref();
