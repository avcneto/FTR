import { randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { isRight } from '@/shared/either'
import { uploadImage } from './upload-image'

describe('get uploads', () => {
  beforeAll(() => {
    vi.mock('@/infra/storage/upload-file-to-storage', () => {
      return {
        uploadFileToStorage: vi.fn().mockImplementation(() => {
          return {
            key: `${randomUUID()}.jpg`,
            url: 'https://storage.com/image.jpg',
          }
        }),
      }
    })
  })

  it('should be able to upload an image', async () => {
    const fileName = `${randomUUID()}.jpg`

    const sut = await uploadImage({
      fileName,
      contentType: 'image/jpeg',
      contentStream: Readable.from([]),
    })

    expect(isRight(sut)).toBe(true)

    const result = await db
      .select()
      .from(schema.uploads)
      .where(eq(schema.uploads.name, fileName))

    expect(result).toHaveLength(1)
  })
})
