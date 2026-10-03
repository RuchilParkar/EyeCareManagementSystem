/**
 * In-Memory Sliding Window Rate Limiter for Next.js API Routes.
 * Protects sensitive endpoints (Login, Register, Password reset) against brute-force attacks.
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, RateLimitStore>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipMap.entries()) {
    if (now > data.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 300000);

/**
 * Check if request from an IP exceeds max attempts within windowMs
 * @param ip Client IP Address
 * @param maxRequests Maximum requests allowed in window
 * @param windowMs Window duration in milliseconds (default 15 minutes)
 * @returns { isRateLimited: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 10,
  windowMs = 15 * 60 * 1000
): { isRateLimited: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitStore = {
      count: 1,
      resetTime: now + windowMs,
    };
    ipMap.set(ip, newEntry);
    return { isRateLimited: false, remaining: maxRequests - 1, resetTime: newEntry.resetTime };
  }

  entry.count += 1;
  ipMap.set(ip, entry);

  if (entry.count > maxRequests) {
    return { isRateLimited: true, remaining: 0, resetTime: entry.resetTime };
  }

  return { isRateLimited: false, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}
