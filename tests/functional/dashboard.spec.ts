import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('DEBUG: check login and cookie handling', async ({ client, assert }) => {
    // Create a user
    const user = await User.create({
      fullName: 'Debug User',
      email: 'debug@example.com',
      password: 'password123',
    })

    console.log('Created user:', { id: user.id, email: user.email })

    // Login to get session cookies
    const loginResponse = await client.post('/login').form({
      email: 'debug@example.com',
      password: 'password123',
    })

    console.log('Login response status:', loginResponse.status())
    console.log('Login response headers:', loginResponse.headers())
    console.log('Login redirect location:', loginResponse.header('location'))

    const cookies = loginResponse.cookies()
    console.log('Cookies after login:', cookies)

    // Try to access dashboard
    const dashboardResponse = await client.get('/dashboard').cookies(cookies).redirects(0)

    console.log('Dashboard response status:', dashboardResponse.status())
    console.log('Dashboard response headers:', dashboardResponse.headers())
    console.log('Dashboard redirect location:', dashboardResponse.header('location'))

    // If it's an HTML response, let's see what component it's trying to render
    if (dashboardResponse.header('content-type')?.includes('text/html')) {
      const responseText = dashboardResponse.text()
      console.log('Response contains dashboard:', responseText.includes('dashboard'))
      console.log('Response contains login:', responseText.includes('login'))
    }
  })

  test('should render dashboard with correct Inertia component for authenticated user', async ({
    client,
  }) => {
    // Create a user
    const user = await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Access dashboard with authenticated session
    const response = await client.get('/dashboard').loginAs(user).withInertia()
    response.assertInertiaComponent('dashboard/index')
  })

  test('should redirect unauthenticated user to login', async ({ client, assert }) => {
    const response = await client.get('/dashboard').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })

  test('should include user data in dashboard props', async ({ client, expect }) => {
    // Create a user with specific data to test
    const user = await User.create({
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
    })

    // Access dashboard
    const response = await client.get('/dashboard').loginAs(user).withInertia()

    response.assertInertiaComponent('dashboard/index')

    expect(response.inertiaProps).toMatchObject({
      user: {
        id: user.id,
        createdAt: expect.any(String),
        fullName: user.fullName,
        email: user.email,
      },
    })
  })

  test('should not allow access to dashboard after logout', async ({ client, assert }) => {
    // Create a user
    const user = await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Login to get session cookies
    const loginResponse = await client.post('/login').form({
      email: 'john@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Logout
    await client.post('/logout').cookies(cookies)

    // Try to access dashboard (should be redirected to login)
    const response = await client.get('/dashboard').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })

  test('should display user information on dashboard', async ({ client, assert }) => {
    // Create a user
    const userData = {
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
    }

    const user = await User.create(userData)

    // Access dashboard
    const response = await client.get('/dashboard').withInertia().loginAs(user)

    response.assertInertiaComponent('dashboard/index')
  })

  test('should maintain session across multiple dashboard requests')
})
