import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { uploadImage } from '@/app/functions/upload-image'
import { isRight, unwrapEither } from '@/shared/either'

export const uploadImageRouter: FastifyPluginAsyncZod = async (server) => {
  server.post(
    '/uploads',
    {
      schema: {
        summary: 'Upload an image',
        tags: ['Uploads'],
        consumes: ['multipart/form-data'],
        response: {
          201: z.null().describe('Image uploaded'),
          400: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const uploadFiles = await request.file({
        limits: { fieldSize: 1024 * 1024 * 5 }, // 2MB
      })

      if (!uploadFiles) {
        return reply.status(400).send({ message: 'File is required.' })
      }

      const result = await uploadImage({
        fileName: uploadFiles.filename,
        contentType: uploadFiles.mimetype,
        contentStream: uploadFiles.file,
      })

      if (uploadFiles.file.truncated) {
        return reply
          .status(400)
          .send({ message: 'File size exceeds the limit of 2MB.' })
      }

      if (isRight(result)) {
        console.log(unwrapEither(result))
        return reply.status(201).send()
      }

      const error = unwrapEither(result)

      switch (error.constructor.name) {
        case 'InvalidFileFormatError':
          return reply.status(400).send({ message: error.message })
      }
    }
  )
}
