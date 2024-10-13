import { createHash } from 'node:crypto'

/**
 * Generate unique hash
 */
export function hashString(value: string): string {
  return createHash('md5').update(value).digest('hex')
}
