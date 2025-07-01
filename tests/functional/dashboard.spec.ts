import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Dashboard', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should render dashboard with correct Inertia component for authenticated user', async ({
    client,
    assert,
  }) => {
    // Create and authenticate a user
    await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Login to get authenticated session
    const loginResponse = await client.post('/login').form({
      email: 'john@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Access dashboard with authenticated session
    const response = await client.get('/dashboard').cookies(cookies)

    assert.equal(response.status(), 200)

    // Check for Inertia response structure
    const responseText = response.text()
    assert.include(responseText, 'dashboard/index') // Component name

    // Check that user data is included in the response
    assert.include(responseText, 'John Doe')
    assert.include(responseText, 'john@example.com')
  })

  test('should redirect unauthenticated user to login', async ({ client, assert }) => {
    const response = await client.get('/dashboard').redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })

  test('should include user data in dashboard props', async ({ client, assert }) => {
    // Create a user with specific data to test
    const user = await User.create({
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
    })

    // Login to get authenticated session
    const loginResponse = await client.post('/login').form({
      email: 'jane.smith@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Access dashboard
    const response = await client.get('/dashboard').cookies(cookies)

    assert.equal(response.status(), 200)

    const responseText = response.text()

    // Verify user data is passed as props
    assert.include(responseText, 'Jane Smith')
    assert.include(responseText, 'jane.smith@example.com')
    assert.include(responseText, user.id.toString())
  })

  test('should not allow access to dashboard after logout', async ({ client, assert }) => {
    // Create and authenticate a user
    await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Login to get authenticated session
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
    // Create and authenticate a user
    const userData = {
      fullName: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
    }

    await User.create(userData)

    const loginResponse = await client
      .post('/login')
      .form({
        email: userData.email,
        password: userData.password,
      })
      .redirects(0)

    const cookies = loginResponse.cookies()

    // Access dashboard
    const response = await client.get('/dashboard').cookies(cookies)

    assert.equal(response.status(), 200)

    // Check if the response contains user data in Inertia props
    const body = response.body()
    assert.include(body, userData.fullName)
    assert.include(body, userData.email)
  })

  test('should maintain session across multiple dashboard requests', async ({ client, assert }) => {
    // Create and authenticate a user
    await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    const loginResponse = await client
      .post('/login')
      .form({
        email: 'test@example.com',
        password: 'password123',
      })
      .redirects(0)

    const cookies = loginResponse.cookies()

    // First dashboard request
    const firstResponse = await client.get('/dashboard').cookies(cookies)
    assert.equal(firstResponse.status(), 200)

    // Second dashboard request with same cookies
    const secondResponse = await client.get('/dashboard').cookies(cookies)
    assert.equal(secondResponse.status(), 200)

    // Third dashboard request with same cookies
    const thirdResponse = await client.get('/dashboard').cookies(cookies)
    assert.equal(thirdResponse.status(), 200)
  })
})
