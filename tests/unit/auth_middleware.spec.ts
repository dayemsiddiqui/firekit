import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Auth Middleware', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.setup(() => testUtils.httpServer().start())

  test('should allow authenticated user to access protected routes', async ({ client, assert }) => {
    // Create a test user
    await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Login the user to get authenticated session
    const loginResponse = await client.post('/login').form({
      email: 'test@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Access protected route (dashboard)
    const response = await client.get('/dashboard').cookies(cookies)

    assert.equal(response.status(), 200)

    // Check for Inertia response
    const responseText = response.text()
    assert.include(responseText, 'dashboard/index')
  })

  test('should redirect unauthenticated user to login page', async ({ client, assert }) => {
    // Try to access protected route without authentication
    const response = await client.get('/dashboard').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })

  test('should preserve original URL in redirect for authentication', async ({
    client,
    assert,
  }) => {
    // Try to access a protected route without authentication
    const response = await client.get('/dashboard').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })
})
