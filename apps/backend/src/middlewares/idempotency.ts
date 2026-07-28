import express, { Request, Response, NextFunction } from 'express';
import {createHash} from 'crypto';

// In-memory Hash Map to store O(1) idempotency records. 
// In a true distributed system, this would be backed by Redis.
const idempotencyCache = new Map<string, {status: number, body: any}>();

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Require clients to send an 'Idempotency-Key' in the headers
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    res.status(400).json({ error: 'Idempotency-Key header is required' });
    return; // Exit the middleware
  }

  // Generate a SHA-256 hash to secure the key
  const hash = createHash('sha256').update(idempotencyKey).digest('hex')

  // Check if I have already processed this exact request
  if (idempotencyCache.has(hash)) {
    const cachedResponse = idempotencyCache.get(hash)!;
    console.log(`[Idempotency] Intercepted duplicate request. Returning cached response.`);
    res.status(cachedResponse.status).json(cachedResponse.body);
    return; // Stop the request lifecycle here
  }

 // Override the native res.json method to automatically cache the response when the controller finishes
  const originalJson = res.json.bind(res);
  
  res.json = (body: any) => {
    // Save the finalized status code and body into the hash map
    idempotencyCache.set(hash, {
      status: res.statusCode,
      body: body
    });

    // Proceed with sending the payload to the user
    return originalJson(body);
  };

  next(); // Pass control to the Express router
}