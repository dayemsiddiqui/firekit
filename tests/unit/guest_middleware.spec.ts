import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Guest Middleware', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.setup(() => testUtils.httpServer().start())

  test('should allow unauthenticated user to access guest routes', async ({ client }) => {
    const response = await client.get('/login').withInertia()

    response.assertInertiaComponent('auth/login')
  })

  test('should allow unauthenticated user to access register page', async ({ client }) => {
    const response = await client.get('/register').withInertia()

    response.assertInertiaComponent('auth/register')
  })

  test('should allow unauthenticated user to access forget password page', async ({ client }) => {
    const response = await client.get('/forget-password').withInertia()

    response.assertInertiaComponent('auth/forget-password')
  })

  test('should redirect authenticated user away from guest routes', async ({ client }) => {
    // Create and login a user
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Try to access login page while authenticated (should redirect to dashboard)
    const response = await client.get('/login').loginAs(user).withInertia()

    response.assertInertiaComponent('dashboard/index')
  })
})
