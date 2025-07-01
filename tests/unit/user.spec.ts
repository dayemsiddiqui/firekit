import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('User Model', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('should create a new user with valid data', async ({ assert }) => {
    const userData = {
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }

    const user = await User.create(userData)

    assert.exists(user.id)
    assert.equal(user.fullName, userData.fullName)
    assert.equal(user.email, userData.email)
    assert.notEqual(user.password, userData.password) // Should be hashed
    assert.isTrue(DateTime.isDateTime(user.createdAt))
    assert.isTrue(DateTime.isDateTime(user.updatedAt))
  })

  test('should not expose password in serialization', async ({ assert }) => {
    const userData = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'password123',
    }

    const user = await User.create(userData)
    const serialized = user.serialize()

    assert.isUndefined(serialized.password)
    assert.equal(serialized.fullName, userData.fullName)
    assert.equal(serialized.email, userData.email)
  })

  test('should verify user credentials correctly', async ({ assert }) => {
    const userData = {
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    }

    await User.create(userData)

    const user = await User.verifyCredentials('test@example.com', 'password123')
    assert.exists(user)
    assert.equal(user.email, 'test@example.com')
  })

  test('should fail to verify user with wrong password', async ({ assert }) => {
    const userData = {
      fullName: 'Test User',
      email: 'test2@example.com',
      password: 'password123',
    }

    await User.create(userData)

    await assert.rejects(
      () => User.verifyCredentials('test2@example.com', 'wrongpassword'),
      'Invalid user credentials'
    )
  })

  test('should fail to verify user with non-existent email', async ({ assert }) => {
    await assert.rejects(
      () => User.verifyCredentials('nonexistent@example.com', 'password123'),
      'Invalid user credentials'
    )
  })

  test('should find user by email', async ({ assert }) => {
    const userData = {
      fullName: 'Find Me',
      email: 'findme@example.com',
      password: 'password123',
    }

    await User.create(userData)

    const user = await User.findBy('email', 'findme@example.com')
    assert.exists(user)
    assert.equal(user!.email, 'findme@example.com')
    assert.equal(user!.fullName, 'Find Me')
  })

  test('should return null for non-existent user', async ({ assert }) => {
    const user = await User.findBy('email', 'notfound@example.com')
    assert.isNull(user)
  })

  test('should enforce unique email constraint', async ({ assert }) => {
    const userData = {
      fullName: 'First User',
      email: 'duplicate@example.com',
      password: 'password123',
    }

    await User.create(userData)

    // Try to create another user with the same email
    await assert.rejects(() =>
      User.create({
        fullName: 'Second User',
        email: 'duplicate@example.com',
        password: 'password456',
      })
    )
  })
})
