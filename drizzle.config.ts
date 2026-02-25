import type { Config } from 'drizzle-kit'
import { env } from '@/env'

export default {
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schema: 'src/infra/db/schemas/*',
  out: 'src/infra/db/migrations',
} satisfies Config
