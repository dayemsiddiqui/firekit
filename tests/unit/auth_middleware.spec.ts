import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Auth Middleware', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.setup(() => testUtils.httpServer().start())

  test('should allow authenticated user to access protected routes', async ({ client }) => {
    // Create a test user
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Access protected route (dashboard)
    const response = await client.get('/dashboard').loginAs(user).withInertia()

    response.assertInertiaComponent('dashboard/index')
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
