import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Authentication - Login Page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should render login page with correct Inertia component', async ({ client, assert }) => {
    const response = await client.get('/login')

    assert.equal(response.status(), 200)

    // Check for Inertia response structure
    const responseText = response.text()
    assert.include(responseText, 'auth/login') // Component name
  })
})

test.group('Authentication - Login Process', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should redirect to dashboard after successful login', async ({ client, assert }) => {
    // Create a test user
    await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/login')
      .form({
        email: 'john@example.com',
        password: 'password123',
      })
      .redirects(0) // Don't follow redirects

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/dashboard')
  })

  test('should redirect back with error for invalid credentials', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .form({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    // Should redirect back to login page
    assert.equal(response.header('location'), '/login')
  })

  test('should redirect back with error for empty credentials', async ({ client, assert }) => {
    const response = await client
      .post('/login')
      .form({
        email: '',
        password: '',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/login')
  })
})

test.group('Authentication - Register Page', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should render register page with correct Inertia component', async ({ client, assert }) => {
    const response = await client.get('/register')

    assert.equal(response.status(), 200)

    // Check for Inertia response structure
    const responseText = response.text()
    assert.include(responseText, 'auth/register') // Component name
  })
})

test.group('Authentication - Register Process', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create user and redirect to dashboard after successful registration', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/register')
      .form({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/dashboard')

    // Verify user was created
    const user = await User.findBy('email', 'jane@example.com')
    assert.isNotNull(user)
    assert.equal(user!.fullName, 'Jane Doe')
  })

  test('should redirect back with error for mismatched passwords', async ({ client, assert }) => {
    const response = await client
      .post('/register')
      .form({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
        passwordConfirmation: 'different123',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/register')
  })

  test('should redirect back with error for short password', async ({ client, assert }) => {
    const response = await client
      .post('/register')
      .form({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: '123',
        passwordConfirmation: '123',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/register')
  })

  test('should redirect back with error for existing email', async ({ client, assert }) => {
    // Create existing user
    await User.create({
      fullName: 'Existing User',
      email: 'existing@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/register')
      .form({
        fullName: 'Jane Doe',
        email: 'existing@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/register')
  })
})

test.group('Authentication - Forget Password', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should render forget password page with correct Inertia component', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/forget-password')

    assert.equal(response.status(), 200)

    // Check for Inertia response structure
    const responseText = response.text()
    assert.include(responseText, 'auth/forget-password') // Component name
  })

  test('should redirect back with success message for existing email', async ({
    client,
    assert,
  }) => {
    // Create a test user
    await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    const response = await client
      .post('/forget-password')
      .form({
        email: 'john@example.com',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/forget-password')
  })

  test('should redirect back with error for non-existing email', async ({ client, assert }) => {
    const response = await client
      .post('/forget-password')
      .form({
        email: 'nonexistent@example.com',
      })
      .redirects(0)

    assert.equal(response.status(), 302)
    assert.equal(response.header('location'), '/forget-password')
  })
})

test.group('Authentication - Logout', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should logout user and redirect to login', async ({ client, assert }) => {
    // Create and login a user first
    await User.create({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Login first
    const loginResponse = await client.post('/login').form({
      email: 'john@example.com',
      password: 'password123',
    })

    const cookies = loginResponse.cookies()

    // Now logout
    const logoutResponse = await client.post('/logout').cookies(cookies).redirects(0)

    assert.equal(logoutResponse.status(), 302)
    assert.equal(logoutResponse.header('location'), '/login')
  })
})
