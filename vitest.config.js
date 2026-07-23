import { defineConfig, configDefaults } from 'vitest/config'

// The env block mirrors what the deleted compose.test.yml used to provide, so
// a bare `npm test` runs the full suite. The S3 local integration tests spin up
// their own Floci via Testcontainers on a dynamic port (Docker required),
// so they run under `npm test` with no external stack — AWS_ENDPOINT_URL below
// is just a load-time default; the test overrides it at runtime via config.set.

export default defineConfig({
  test: {
    globals: true,
    include: ['**/test/**/*.test.js'],
    exclude: [...configDefaults.exclude],
    clearMocks: true,
    env: {
      KEYS_DIRECTORY: './.test-keys',
      ENTRA_ENABLED: 'true',
      ENTRA_WELL_KNOWN_URL: 'https://login.microsoftonline.com/test-tenant-id/v2.0/.well-known/openid-configuration',
      ENTRA_CLIENT_ID: 'test-client-id',
      ENTRA_CLIENT_SECRET: 'test-client-secret',
      ENTRA_REDIRECT_URL: 'http://localhost:3007/auth/sign-in-oidc',
      ENTRA_SIGN_OUT_REDIRECT_URL: 'http://localhost:3007',
      AWS_S3_ENABLED: 'true',
      AWS_S3_BUCKET: 'trade-imports-defra-id-stub-data',
      AWS_ENDPOINT_URL: 'http://localhost:4566',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test'
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      clean: false,
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [
        ...configDefaults.exclude,
        '**/test/**',
        'coverage',
        '.public',
        'postcss.config.js'
      ]
    }
  }
})
