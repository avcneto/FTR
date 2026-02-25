import { fastifyCors } from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastifySwagger from '@fastify/swagger'
import { fastifySwaggerUi } from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from '@/env'
import { uploadImageRouter } from './routers/upload-image'
import { tranformSwaggerSchema } from './transforme-swagger-schema'

const server = fastify()

server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

server.setErrorHandler((error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.status(400).send({
      message: 'Validation error',
      issues: error.validation,
    })
  }

  // send error to observability tool like Sentry, DataDog, NewRelic
  console.error(error)

  return reply.status(500).send({
    message: 'Internal server error',
  })
})

await server.register(fastifyCors, {
  origin: '*',
})

console.log(env.DATABASE_URL)

server.register(fastifyMultipart)
server.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Upload Server',
      version: '1.0.0',
    },
  },
  transform: tranformSwaggerSchema,
})

server.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

server.register(uploadImageRouter)

server.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running on http://localhost:3333')
})
