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
    assert,
  }) => {
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

    // Access dashboard with authenticated session
    const response = await client.get('/dashboard').cookies(cookies).withInertia()

    response.assertInertiaComponent('dashboard/index')
    assert.equal(response.status(), 200)

    // Check that user data is included in the response
    const responseText = response.text()
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

    // Login to get session cookies
    const loginResponse = await client.post('/login').form({
      email: 'jane.smith@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Access dashboard
    const response = await client.get('/dashboard').cookies(cookies).withInertia()

    response.assertInertiaComponent('dashboard/index')
    assert.equal(response.status(), 200)

    const responseText = response.text()

    // Verify user data is passed as props
    assert.include(responseText, 'Jane Smith')
    assert.include(responseText, 'jane.smith@example.com')
    assert.include(responseText, user.id.toString())
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

    // Login to get session cookies
    const loginResponse = await client.post('/login').form({
      email: userData.email,
      password: userData.password,
    })

    const cookies = loginResponse.cookies()

    // Access dashboard
    const response = await client.get('/dashboard').cookies(cookies).withInertia()

    response.assertInertiaComponent('dashboard/index')
    assert.equal(response.status(), 200)

    // Check if the response contains user data
    const responseText = response.text()
    assert.include(responseText, userData.fullName)
    assert.include(responseText, userData.email)
  })

  test('should maintain session across multiple dashboard requests', async ({ client, assert }) => {
    // Create a user
    const user = await User.create({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    // Login to get session cookies
    const loginResponse = await client.post('/login').form({
      email: 'test@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // First dashboard request with authentication
    const firstResponse = await client.get('/dashboard').cookies(cookies).withInertia()
    firstResponse.assertInertiaComponent('dashboard/index')
    assert.equal(firstResponse.status(), 200)

    // Second dashboard request with same session
    const secondResponse = await client.get('/dashboard').cookies(cookies).withInertia()
    secondResponse.assertInertiaComponent('dashboard/index')
    assert.equal(secondResponse.status(), 200)

    // Third dashboard request with same session
    const thirdResponse = await client.get('/dashboard').cookies(cookies).withInertia()
    thirdResponse.assertInertiaComponent('dashboard/index')
    assert.equal(thirdResponse.status(), 200)
  })
})
