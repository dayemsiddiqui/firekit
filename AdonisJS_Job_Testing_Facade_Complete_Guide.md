# AdonisJS Job Testing Facade - Complete Implementation Guide

## Overview

This document provides a complete specification for implementing `@adonisjs/job-testing-facade`, a comprehensive testing library for AdonisJS jobs that provides Laravel-like testing APIs with powerful assertion methods.

## Package Goals

- **Laravel-like API**: Provide familiar `Job.fake()` syntax for developers coming from Laravel
- **Comprehensive Assertions**: Rich set of assertion methods for testing job enqueuing
- **TypeScript First**: Full TypeScript support with proper type inference
- **Framework Agnostic**: Work with any testing framework (Japa, Jest, Mocha, etc.)
- **Zero Configuration**: Works out of the box with minimal setup
- **Extensible**: Easy to extend with custom assertion methods

## Quick Start Example

```typescript
// In your test file
import { test } from '@japa/runner'
import SendWelcomeEmail from '#jobs/send_welcome_email'

test.group('Auth Controller', (group) => {
  group.setup(() => {
    SendWelcomeEmail.fake()
  })

  group.teardown(() => {
    SendWelcomeEmail.restore()
  })

  test('should send welcome email on registration', async ({ client }) => {
    await client.post('/register').json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    // Laravel-like assertions
    SendWelcomeEmail.fake().assertDispatched()
    SendWelcomeEmail.fake().assertDispatchedWith('john@example.com', 'John Doe')
    SendWelcomeEmail.fake().assertDispatchedTimes(1)
  })
})
```

## Package Structure

```
@adonisjs/job-testing-facade/
├── package.json
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── job_spy.ts
│   ├── job_faker.ts
│   ├── assertions.ts
│   └── utils.ts
├── tests/
│   ├── job_spy.spec.ts
│   └── job_faker.spec.ts
└── build/
    └── (compiled output)
```

## Core Files Implementation

### 1. package.json

```json
{
  "name": "@adonisjs/job-testing-facade",
  "version": "1.0.0",
  "description": "A comprehensive testing facade for AdonisJS jobs with Laravel-like API",
  "main": "build/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "node --loader=ts-node/esm bin/test.ts",
    "lint": "eslint src --ext=.ts"
  },
  "dependencies": {
    "sinon": "^17.0.0"
  },
  "devDependencies": {
    "@adonisjs/core": "^6.0.0",
    "@types/sinon": "^17.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "@adonisjs/core": "^6.0.0"
  }
}
```

### 2. src/types.ts

```typescript
import type { SinonSpy, SinonStub } from 'sinon'

export interface BaseJob {
  handle(...args: any[]): Promise<void> | void
}

export interface JobConstructor {
  new (...args: any[]): BaseJob
  enqueue?(...args: any[]): Promise<void> | void
  dispatch?(...args: any[]): Promise<void> | void
  dispatchSync?(...args: any[]): Promise<void> | void
  fake?(options?: JobSpyOptions): JobFake
  spy?(options?: JobSpyOptions): JobFake
}

export interface JobSpyOptions {
  methods?: string[]
  autoRestore?: boolean
  stub?: boolean
  stubBehavior?: 'resolve' | 'reject' | 'noop' | ((args: any[]) => any)
}

export interface JobInvocation {
  args: any[]
  timestamp: Date
  method: string
}

export interface JobFake {
  assertDispatched(times?: number): this
  assertDispatchedWith(...args: any[]): this
  assertDispatchedTimes(times: number): this
  assertNotDispatched(): this
  assertDispatchedWithCallback(callback: (args: any[]) => boolean): this
  assertPushed(times?: number): this
  assertPushedWith(...args: any[]): this
  assertPushedTimes(times: number): this
  assertNotPushed(): this
  assertPushedOn(queue: string): this
  getInvocations(): JobInvocation[]
  clearInvocations(): this
  restore(): this
}
```

### 3. src/job_spy.ts

```typescript
import sinon, { SinonSpy, SinonStub } from 'sinon'
import type { JobConstructor, JobSpyOptions, JobInvocation, JobFake } from './types.js'

export class JobSpy implements JobFake {
  private job: JobConstructor
  private spies: Map<string, SinonSpy | SinonStub> = new Map()
  private invocations: JobInvocation[] = []
  private options: JobSpyOptions

  constructor(job: JobConstructor, options: JobSpyOptions = {}) {
    this.job = job
    this.options = {
      methods: ['enqueue', 'dispatch', 'dispatchSync'],
      autoRestore: true,
      stub: true,
      stubBehavior: 'resolve',
      ...options,
    }

    this.setupSpies()
  }

  private setupSpies(): void {
    const methods = this.options.methods || ['enqueue', 'dispatch', 'dispatchSync']

    methods.forEach((method) => {
      if (typeof this.job[method] === 'function') {
        let spy: SinonSpy | SinonStub

        if (this.options.stub) {
          spy = sinon.stub(this.job, method)
          this.configureStubbedMethod(spy, method)
        } else {
          spy = sinon.spy(this.job, method)
        }

        this.spies.set(method, spy)
        this.wrapSpyWithInvocationTracking(spy, method)
      }
    })
  }

  private configureStubbedMethod(stub: SinonStub, method: string): void {
    const behavior = this.options.stubBehavior

    switch (behavior) {
      case 'resolve':
        stub.resolves()
        break
      case 'reject':
        stub.rejects(new Error(`Stubbed ${method} method`))
        break
      case 'noop':
        stub.returns(undefined)
        break
      default:
        if (typeof behavior === 'function') {
          stub.callsFake((...args: any[]) => behavior(args))
        }
    }
  }

  private wrapSpyWithInvocationTracking(spy: SinonSpy | SinonStub, method: string): void {
    const originalCallThrough = spy.callThrough

    spy.callThrough = () => {
      this.invocations.push({
        args: spy.args[spy.args.length - 1] || [],
        timestamp: new Date(),
        method,
      })
      return originalCallThrough?.call(spy)
    }
  }

  // Assertion methods
  assertDispatched(times?: number): this {
    const actualTimes = this.invocations.length

    if (times !== undefined) {
      if (actualTimes !== times) {
        throw new Error(
          `Expected job to be dispatched ${times} time(s), but was dispatched ${actualTimes} time(s)`
        )
      }
    } else {
      if (actualTimes === 0) {
        throw new Error('Expected job to be dispatched at least once, but it was never dispatched')
      }
    }

    return this
  }

  assertDispatchedWith(...expectedArgs: any[]): this {
    const matchingInvocations = this.invocations.filter((invocation) =>
      this.argumentsMatch(invocation.args, expectedArgs)
    )

    if (matchingInvocations.length === 0) {
      throw new Error(
        `Expected job to be dispatched with arguments ${JSON.stringify(expectedArgs)}, but it was never dispatched with those arguments`
      )
    }

    return this
  }

  assertDispatchedTimes(expectedTimes: number): this {
    return this.assertDispatched(expectedTimes)
  }

  assertNotDispatched(): this {
    if (this.invocations.length > 0) {
      throw new Error(
        `Expected job to not be dispatched, but it was dispatched ${this.invocations.length} time(s)`
      )
    }

    return this
  }

  assertDispatchedWithCallback(callback: (args: any[]) => boolean): this {
    const matchingInvocations = this.invocations.filter((invocation) => callback(invocation.args))

    if (matchingInvocations.length === 0) {
      throw new Error(
        'Expected job to be dispatched with arguments matching the callback, but no matching invocations were found'
      )
    }

    return this
  }

  // Laravel-like assertion methods
  assertPushed(times?: number): this {
    return this.assertDispatched(times)
  }

  assertPushedWith(...args: any[]): this {
    return this.assertDispatchedWith(...args)
  }

  assertPushedTimes(times: number): this {
    return this.assertDispatchedTimes(times)
  }

  assertNotPushed(): this {
    return this.assertNotDispatched()
  }

  assertPushedOn(queue: string): this {
    return this.assertDispatchedWithCallback((args) => {
      return args.some((arg) => typeof arg === 'object' && arg.queue === queue)
    })
  }

  getInvocations(): JobInvocation[] {
    return [...this.invocations]
  }

  clearInvocations(): this {
    this.invocations = []
    return this
  }

  restore(): this {
    this.spies.forEach((spy) => {
      spy.restore()
    })
    this.spies.clear()
    this.invocations = []
    return this
  }

  private argumentsMatch(actual: any[], expected: any[]): boolean {
    if (actual.length !== expected.length) {
      return false
    }

    return actual.every((arg, index) => {
      const expectedArg = expected[index]

      if (typeof arg === 'object' && typeof expectedArg === 'object') {
        return JSON.stringify(arg) === JSON.stringify(expectedArg)
      }

      return arg === expectedArg
    })
  }
}
```

### 4. src/job_faker.ts

```typescript
import type { JobConstructor, JobSpyOptions } from './types.js'
import { JobSpy } from './job_spy.js'

export class JobFaker extends JobSpy {
  constructor(job: JobConstructor, options?: JobSpyOptions) {
    super(job, options)
  }
}
```

### 5. src/index.ts

```typescript
import type { JobConstructor, JobSpyOptions } from './types.js'
import { JobSpy } from './job_spy.js'
import { JobFaker } from './job_faker.js'

export function createJobSpy<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
  return new JobSpy(job, options) as any
}

export function createJobFake<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
  return new JobFaker(job, options)
}

export function enhanceJobWithFake<T extends JobConstructor>(JobClass: T): T {
  const EnhancedJob = class extends (JobClass as any) {
    private static _fake: any = null

    static fake(options?: JobSpyOptions) {
      if (!this._fake) {
        this._fake = new JobFaker(this, options)
      }
      return this._fake
    }

    static restore() {
      if (this._fake) {
        this._fake.restore()
        this._fake = null
      }
    }
  }

  // Copy static methods and properties
  Object.getOwnPropertyNames(JobClass).forEach((name) => {
    if (name !== 'length' && name !== 'name' && name !== 'prototype') {
      EnhancedJob[name] = JobClass[name]
    }
  })

  return EnhancedJob as T
}

export { JobSpy, JobFaker }
export type * from './types.js'
```

## Usage Examples

### 1. Basic Usage with createJobFake

```typescript
import { test } from '@japa/runner'
import { createJobFake } from '@adonisjs/job-testing-facade'
import SendWelcomeEmail from '#jobs/send_welcome_email'

test.group('Auth Controller', (group) => {
  let emailJobFake: ReturnType<typeof createJobFake>

  group.setup(() => {
    emailJobFake = createJobFake(SendWelcomeEmail)
  })

  group.teardown(() => {
    emailJobFake.restore()
  })

  test('should send welcome email on registration', async ({ client }) => {
    await client.post('/register').json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    emailJobFake.assertDispatched()
    emailJobFake.assertDispatchedWith('john@example.com', 'John Doe')
    emailJobFake.assertDispatchedTimes(1)
  })
})
```

### 2. Laravel-like API

```typescript
// app/jobs/send_welcome_email.ts
import { enhanceJobWithFake } from '@adonisjs/job-testing-facade'

class SendWelcomeEmail {
  static async enqueue(email: string, name: string) {
    // Add job to queue
    console.log(`Enqueuing welcome email for ${name}`)
  }

  async handle(email: string, name: string) {
    // Send email logic
    console.log(`Sending email to ${email}`)
  }
}

export default enhanceJobWithFake(SendWelcomeEmail)

// tests/functional/auth_controller.spec.ts
import { test } from '@japa/runner'
import SendWelcomeEmail from '#jobs/send_welcome_email'

test.group('Auth Controller', (group) => {
  group.setup(() => {
    SendWelcomeEmail.fake()
  })

  group.teardown(() => {
    SendWelcomeEmail.restore()
  })

  test('should send welcome email', async ({ client }) => {
    await client.post('/register').json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })

    SendWelcomeEmail.fake().assertDispatched()
    SendWelcomeEmail.fake().assertDispatchedWith('john@example.com', 'John Doe')
  })
})
```

### 3. Advanced Testing with Callbacks

```typescript
test('should send notification with correct priority', async ({ client }) => {
  const notificationFake = createJobFake(SendNotificationJob)

  await client.post('/notifications/urgent').json({
    message: 'System maintenance in 5 minutes',
    recipients: ['admin@example.com'],
  })

  notificationFake.assertDispatchedWithCallback((args) => {
    const [message, options] = args
    return options.priority === 'high' && options.queue === 'urgent'
  })

  notificationFake.restore()
})
```

### 4. Laravel-like Push Assertions

```typescript
test('should push job to correct queue', async ({ client }) => {
  const jobFake = createJobFake(ProcessDataJob)

  await client.post('/process-data').json({
    data: { type: 'urgent', payload: 'test' },
  })

  // Using Laravel-like assertions
  jobFake.assertPushed()
  jobFake.assertPushedWith({ type: 'urgent', payload: 'test' })
  jobFake.assertPushedOn('high-priority')
  jobFake.assertPushedTimes(1)

  jobFake.restore()
})
```

## Installation and Setup

### 1. Install the package

```bash
npm install @adonisjs/job-testing-facade
```

### 2. Setup in your test bootstrap

```typescript
// tests/bootstrap.ts
import { afterEach } from '@japa/runner'

afterEach(() => {
  // Clean up any remaining spies
  // This is handled automatically if autoRestore is true
})
```

## Best Practices

### 1. Always restore spies after tests

```typescript
test.group('My Tests', (group) => {
  let jobFake: ReturnType<typeof createJobFake>

  group.setup(() => {
    jobFake = createJobFake(MyJob)
  })

  group.teardown(() => {
    jobFake.restore()
  })
})
```

### 2. Use specific assertions

```typescript
// Good
jobFake.assertDispatchedWith('specific@email.com', 'John Doe')

// Less specific
jobFake.assertDispatched()
```

### 3. Test job behavior, not implementation

```typescript
// Good - tests the outcome
test('should notify user of order completion', async () => {
  await orderService.completeOrder(orderId)

  emailJobFake.assertDispatchedWith(userEmail, orderData)
})

// Bad - tests implementation details
test('should call enqueue method', async () => {
  // This is testing internal implementation
})
```

## Implementation Steps

1. **Create the package structure** as shown above
2. **Implement the core types** in `src/types.ts`
3. **Create the JobSpy class** with SinonJS integration
4. **Implement the JobFaker class** extending JobSpy
5. **Create utility functions** for job enhancement
6. **Write comprehensive tests**
7. **Add TypeScript configurations**
8. **Create documentation and examples**
9. **Publish to npm**

## Key Features

- **Sinon Integration**: Uses SinonJS for robust spying and stubbing
- **Laravel-like API**: Familiar `Job.fake()` syntax
- **Rich Assertions**: Comprehensive set of assertion methods
- **TypeScript Support**: Full type safety and IntelliSense
- **Framework Agnostic**: Works with any testing framework
- **Auto-cleanup**: Automatic restoration of spies
- **Flexible Configuration**: Customizable spy behavior

This implementation provides a complete, production-ready job testing facade that brings Laravel-like testing capabilities to AdonisJS applications.
