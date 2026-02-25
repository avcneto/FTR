import { Readable } from 'node:stream'
import { z } from 'zod'
import { db } from '@/infra/db'
import { schema } from '@/infra/db/schemas'
import { uploadFileToStorage } from '@/infra/storage/upload-file-to-storage'
import { type Either, makeLeft, makeRight } from '@/shared/either'
import { InvalidFileFormatError } from './errors/invalid-file-format'

const uploadTimageInput = z.object({
  fileName: z.string(),
  contentType: z.string(),
  contentStream: z.instanceof(Readable),
})

type UploadImageInput = z.infer<typeof uploadTimageInput>

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function uploadImage(
  input: UploadImageInput
): Promise<Either<InvalidFileFormatError, { url: string }>> {
  const { fileName, contentType, contentStream } =
    uploadTimageInput.parse(input)

  if (!allowedMimeTypes.includes(contentType)) {
    return makeLeft(new InvalidFileFormatError())
  }

  // TODO carregar a imagem para o clodflare R2

  const { key, url } = await uploadFileToStorage({
    folder: 'images',
    fileName,
    contentType,
    contentStream,
  })

  await db.insert(schema.uploads).values({
    name: fileName,
    remoteKey: key,
    remoteUrl: url,
  })

  return makeRight({ url })
}
