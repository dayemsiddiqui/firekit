import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Guest Middleware', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.setup(() => testUtils.httpServer().start())

  test('should allow unauthenticated user to access guest routes', async ({ client, assert }) => {
    const response = await client.get('/login')

    assert.equal(response.status(), 200)

    // Check for Inertia response
    const responseText = response.text()
    assert.include(responseText, 'auth/login')
  })

  test('should allow unauthenticated user to access register page', async ({ client, assert }) => {
    const response = await client.get('/register')

    assert.equal(response.status(), 200)

    // Check for Inertia response
    const responseText = response.text()
    assert.include(responseText, 'auth/register')
  })

  test('should allow unauthenticated user to access forget password page', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/forget-password')

    assert.equal(response.status(), 200)

    // Check for Inertia response
    const responseText = response.text()
    assert.include(responseText, 'auth/forget-password')
  })

  test('should redirect authenticated user away from guest routes', async ({ client, assert }) => {
    // Create and login a user
    await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Login first
    const loginResponse = await client.post('/login').form({
      email: 'test@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Try to access login page while authenticated (should redirect to dashboard)
    const response = await client.get('/login').cookies(cookies).redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/dashboard')
  })
})
