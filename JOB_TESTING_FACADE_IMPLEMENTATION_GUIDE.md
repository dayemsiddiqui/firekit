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

## Package Structure

```
@adonisjs/job-testing-facade/
├── package.json
├── README.md
├── LICENSE
├── .gitignore
├── .npmignore
├── tsconfig.json
├── eslint.config.js
├── src/
│   ├── index.ts                 # Main export file
│   ├── types.ts                 # TypeScript interfaces and types
│   ├── job_spy.ts              # Core spy implementation
│   ├── job_faker.ts            # Laravel-like faker implementation
│   ├── assertions.ts           # Assertion methods
│   ├── decorators.ts           # Method decorators for jobs
│   └── utils.ts                # Utility functions
├── stubs/
│   └── config.stub             # Configuration stub
├── configure.ts                # AdonisJS configuration
├── tests/
│   ├── job_spy.spec.ts
│   ├── job_faker.spec.ts
│   ├── assertions.spec.ts
│   └── fixtures/
│       └── sample_jobs.ts
└── build/                      # Compiled output
    └── ...
```

## Core Implementation Files

### 1. package.json

```json
{
  "name": "@adonisjs/job-testing-facade",
  "version": "1.0.0",
  "description": "A comprehensive testing facade for AdonisJS jobs with Laravel-like API",
  "keywords": ["adonisjs", "jobs", "testing", "spy", "mock", "facade"],
  "main": "build/index.js",
  "type": "module",
  "files": ["build", "configure.ts", "stubs"],
  "exports": {
    ".": "./build/index.js",
    "./types": "./build/types.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "c8 node --loader=ts-node/esm bin/test.ts",
    "lint": "eslint src --ext=.ts",
    "format": "prettier --write .",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "sinon": "^17.0.0"
  },
  "devDependencies": {
    "@adonisjs/core": "^6.0.0",
    "@adonisjs/assembler": "^7.0.0",
    "@japa/runner": "^3.0.0",
    "@japa/assert": "^2.0.0",
    "@types/sinon": "^17.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "c8": "^8.0.0",
    "ts-node": "^10.0.0"
  },
  "peerDependencies": {
    "@adonisjs/core": "^6.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/adonisjs/job-testing-facade.git"
  },
  "author": "AdonisJS Team",
  "license": "MIT"
}
```

### 2. src/types.ts

```typescript
import type { SinonSpy, SinonStub } from 'sinon'

/**
 * Base job interface that all jobs should implement
 */
export interface BaseJob {
  handle(...args: any[]): Promise<void> | void
}

/**
 * Job constructor interface
 */
export interface JobConstructor {
  new (...args: any[]): BaseJob
  enqueue?(...args: any[]): Promise<void> | void
  dispatch?(...args: any[]): Promise<void> | void
  dispatchSync?(...args: any[]): Promise<void> | void
  fake?(options?: JobSpyOptions): JobFake
  spy?(options?: JobSpyOptions): JobFake
}

/**
 * Job spy configuration options
 */
export interface JobSpyOptions {
  methods?: string[]
  autoRestore?: boolean
  stub?: boolean
  stubBehavior?: 'resolve' | 'reject' | 'noop' | ((args: any[]) => any)
}

/**
 * Job invocation details
 */
export interface JobInvocation {
  args: any[]
  timestamp: Date
  method: string
}

/**
 * Job fake interface
 */
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
  assertPushedWithChain(jobs: any[]): this
  getInvocations(): JobInvocation[]
  clearInvocations(): this
  restore(): this
}

/**
 * Assertion error interface
 */
export interface AssertionError extends Error {
  expected?: any
  actual?: any
  operator?: string
}

/**
 * Job testing facade interface
 */
export interface JobTestingFacade {
  spy<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFake
  fake<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFake
  restoreAll(): void
  clearAll(): void
}

/**
 * Job method decorator options
 */
export interface JobMethodDecoratorOptions {
  trackInvocations?: boolean
  allowTesting?: boolean
}
```

### 3. src/utils.ts

```typescript
import type { AssertionError } from './types.js'

/**
 * Create a detailed assertion error
 */
export function createAssertionError(
  message: string,
  expected?: any,
  actual?: any,
  operator?: string
): AssertionError {
  const error = new Error(message) as AssertionError
  error.name = 'AssertionError'
  error.expected = expected
  error.actual = actual
  error.operator = operator

  return error
}

/**
 * Deep compare two values
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b
  }

  if (a === null || a === undefined || b === null || b === undefined) {
    return false
  }

  if (a.prototype !== b.prototype) return false

  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false

  return keys.every((k) => deepEqual(a[k], b[k]))
}

/**
 * Format arguments for display in error messages
 */
export function formatArguments(args: any[]): string {
  return args
    .map((arg) => {
      if (typeof arg === 'string') {
        return `"${arg}"`
      }
      if (typeof arg === 'object') {
        return JSON.stringify(arg, null, 2)
      }
      return String(arg)
    })
    .join(', ')
}

/**
 * Check if value is a promise
 */
export function isPromise(value: any): value is Promise<any> {
  return value && typeof value.then === 'function'
}
```

### 4. src/job_spy.ts

```typescript
import sinon, { SinonSpy, SinonStub } from 'sinon'
import type { JobConstructor, JobSpyOptions, JobInvocation, JobFake } from './types.js'
import { createAssertionError } from './utils.js'

/**
 * Core job spy implementation
 */
export class JobSpy implements JobFake {
  private job: JobConstructor
  private spies: Map<string, SinonSpy | SinonStub> = new Map()
  private invocations: JobInvocation[] = []
  private options: JobSpyOptions
  private originalMethods: Map<string, Function> = new Map()

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
        this.originalMethods.set(method, this.job[method])

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
    const originalCallsFake = spy.callsFake

    spy.callsFake = (...args: any[]) => {
      this.invocations.push({
        args: [...args],
        timestamp: new Date(),
        method,
      })

      if (originalCallsFake) {
        return originalCallsFake.call(spy, ...args)
      }

      if (this.options.stub) {
        return this.executeStubBehavior(args)
      }

      const originalMethod = this.originalMethods.get(method)
      if (originalMethod) {
        return originalMethod.apply(this.job, args)
      }
    }
  }

  private executeStubBehavior(args: any[]): any {
    const behavior = this.options.stubBehavior

    switch (behavior) {
      case 'resolve':
        return Promise.resolve()
      case 'reject':
        return Promise.reject(new Error('Stubbed method'))
      case 'noop':
        return undefined
      default:
        if (typeof behavior === 'function') {
          return behavior(args)
        }
        return Promise.resolve()
    }
  }

  // Assertion methods
  assertDispatched(times?: number): this {
    const actualTimes = this.invocations.length

    if (times !== undefined) {
      if (actualTimes !== times) {
        throw createAssertionError(
          `Expected job to be dispatched ${times} time(s), but was dispatched ${actualTimes} time(s)`,
          times,
          actualTimes
        )
      }
    } else {
      if (actualTimes === 0) {
        throw createAssertionError(
          'Expected job to be dispatched at least once, but it was never dispatched',
          'at least 1',
          0
        )
      }
    }

    return this
  }

  assertDispatchedWith(...expectedArgs: any[]): this {
    const matchingInvocations = this.invocations.filter((invocation) =>
      this.argumentsMatch(invocation.args, expectedArgs)
    )

    if (matchingInvocations.length === 0) {
      throw createAssertionError(
        `Expected job to be dispatched with arguments ${JSON.stringify(expectedArgs)}, but it was never dispatched with those arguments`,
        expectedArgs,
        this.invocations.map((inv) => inv.args)
      )
    }

    return this
  }

  assertDispatchedTimes(expectedTimes: number): this {
    return this.assertDispatched(expectedTimes)
  }

  assertNotDispatched(): this {
    if (this.invocations.length > 0) {
      throw createAssertionError(
        `Expected job to not be dispatched, but it was dispatched ${this.invocations.length} time(s)`,
        0,
        this.invocations.length
      )
    }

    return this
  }

  assertDispatchedWithCallback(callback: (args: any[]) => boolean): this {
    const matchingInvocations = this.invocations.filter((invocation) => callback(invocation.args))

    if (matchingInvocations.length === 0) {
      throw createAssertionError(
        'Expected job to be dispatched with arguments matching the callback, but no matching invocations were found',
        'matching invocations',
        'no matches'
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

  assertPushedWithChain(jobs: any[]): this {
    return this.assertDispatchedWithCallback((args) => {
      return args.some(
        (arg) =>
          Array.isArray(arg) &&
          arg.length === jobs.length &&
          arg.every((job, index) => job.constructor === jobs[index])
      )
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

### 5. src/job_faker.ts

```typescript
import type { JobConstructor, JobSpyOptions, JobFake } from './types.js'
import { JobSpy } from './job_spy.js'

/**
 * Laravel-like job faker implementation
 */
export class JobFaker extends JobSpy {
  constructor(job: JobConstructor, options?: JobSpyOptions) {
    super(job, options)
  }
}
```

### 6. src/decorators.ts

```typescript
import type { JobMethodDecoratorOptions } from './types.js'

/**
 * Method decorator to enable testing for job methods
 */
export function testable(options: JobMethodDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      if (options.trackInvocations) {
        if (!this.__testingInvocations) {
          this.__testingInvocations = []
        }
        this.__testingInvocations.push({
          method: propertyKey,
          args: [...args],
          timestamp: new Date(),
        })
      }

      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Class decorator to make jobs testable with Laravel-like API
 */
export function testableJob(options: JobMethodDecoratorOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      private static _fake: any = null

      static fake(fakeOptions?: any) {
        if (!this._fake) {
          const { JobFaker } = require('./job_faker.js')
          this._fake = new JobFaker(this, fakeOptions)
        }
        return this._fake
      }

      static spy(spyOptions?: any) {
        const { JobSpy } = require('./job_spy.js')
        return new JobSpy(this, spyOptions)
      }

      static restore() {
        if (this._fake) {
          this._fake.restore()
          this._fake = null
        }
      }
    }
  }
}
```

### 7. src/index.ts

```typescript
import type { JobConstructor, JobSpyOptions, JobTestingFacade } from './types.js'
import { JobSpy } from './job_spy.js'
import { JobFaker } from './job_faker.js'
import { testable, testableJob } from './decorators.js'

/**
 * Global job testing facade
 */
class JobTestingFacadeImpl implements JobTestingFacade {
  private activeFakes: Map<JobConstructor, JobFaker> = new Map()
  private activeSpies: Map<JobConstructor, JobSpy> = new Map()

  spy<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
    const spy = new JobSpy(job, options)
    this.activeSpies.set(job, spy)
    return spy as any
  }

  fake<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
    const faker = new JobFaker(job, options)
    this.activeFakes.set(job, faker)
    return faker
  }

  restoreAll(): void {
    this.activeFakes.forEach((fake) => fake.restore())
    this.activeSpies.forEach((spy) => spy.restore())
    this.activeFakes.clear()
    this.activeSpies.clear()
  }

  clearAll(): void {
    this.activeFakes.forEach((fake) => fake.clearInvocations())
    this.activeSpies.forEach((spy) => spy.clearInvocations())
  }
}

// Global instance
const jobTestingFacade = new JobTestingFacadeImpl()

/**
 * Create a job spy
 */
export function createJobSpy<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
  return jobTestingFacade.spy(job, options)
}

/**
 * Create a job fake (Laravel-like API)
 */
export function createJobFake<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFaker {
  return jobTestingFacade.fake(job, options)
}

/**
 * Restore all active fakes and spies
 */
export function restoreAllJobs(): void {
  jobTestingFacade.restoreAll()
}

/**
 * Clear all invocations
 */
export function clearAllJobInvocations(): void {
  jobTestingFacade.clearAll()
}

/**
 * Enhance job class with fake() method
 */
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

// Export everything
export { JobSpy, JobFaker, testable, testableJob, jobTestingFacade }
export type * from './types.js'

// Default export
export default jobTestingFacade
```

### 8. configure.ts

```typescript
import type { ApplicationService } from '@adonisjs/core/types'

/**
 * Job testing facade configuration
 */
export default function configure(options: any = {}) {
  return {
    register(app: ApplicationService) {
      app.container.singleton('job.testing', () => {
        const { default: jobTestingFacade } = require('./build/index.js')
        return jobTestingFacade
      })
    },

    boot(app: ApplicationService) {
      // Boot logic if needed
    },
  }
}
```

## Usage Examples

### 1. Basic Job Testing

```typescript
// tests/functional/auth_controller.spec.ts
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
      passwordConfirmation: 'password123',
    })

    emailJobFake.assertDispatched()
    emailJobFake.assertDispatchedWith('john@example.com', 'John Doe')
  })
})
```

### 2. Laravel-like API with Enhanced Jobs

```typescript
// app/jobs/send_welcome_email.ts
import { enhanceJobWithFake } from '@adonisjs/job-testing-facade'

class SendWelcomeEmail {
  static async enqueue(email: string, name: string) {
    // Add job to queue
  }

  async handle(email: string, name: string) {
    // Send email logic
  }
}

// Enhance the job class
export default enhanceJobWithFake(SendWelcomeEmail)

// Now you can use it in tests like this:
// tests/functional/orders_controller.spec.ts
import { test } from '@japa/runner'
import SendWelcomeEmail from '#jobs/send_welcome_email'

test.group('Orders Controller', (group) => {
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
      passwordConfirmation: 'password123',
    })

    SendWelcomeEmail.fake().assertDispatched()
    SendWelcomeEmail.fake().assertDispatchedWith('john@example.com', 'John Doe')
  })
})
```

### 3. Using Decorators for Automatic Enhancement

```typescript
// app/jobs/enhanced_job.ts
import { testableJob } from '@adonisjs/job-testing-facade'

@testableJob()
export default class EnhancedJob {
  static async enqueue(data: any) {
    // Job enqueuing logic
  }

  async handle(data: any) {
    // Job handling logic
  }
}

// In tests - no need to import enhanceJobWithFake
test('enhanced job with decorators', async () => {
  const jobFake = EnhancedJob.fake()

  await EnhancedJob.enqueue({ userId: 1 })

  jobFake.assertDispatched()
  jobFake.assertDispatchedWith({ userId: 1 })
})
```

### 4. Advanced Testing with Callbacks

```typescript
// tests/functional/notifications_controller.spec.ts
import { test } from '@japa/runner'
import { createJobFake } from '@adonisjs/job-testing-facade'
import SendNotificationJob from '#jobs/send_notification'

test.group('Notifications Controller', (group) => {
  let notificationFake: ReturnType<typeof createJobFake>

  group.setup(() => {
    notificationFake = createJobFake(SendNotificationJob)
  })

  group.teardown(() => {
    notificationFake.restore()
  })

  test('should send notification with correct priority', async ({ client }) => {
    await client.post('/notifications/urgent').json({
      message: 'System maintenance in 5 minutes',
      recipients: ['admin@example.com'],
    })

    notificationFake.assertDispatchedWithCallback((args) => {
      const [message, options] = args
      return options.priority === 'high' && options.queue === 'urgent'
    })
  })

  test('should batch notifications correctly', async ({ client }) => {
    await client.post('/notifications/batch').json({
      messages: [
        { text: 'Message 1', recipient: 'user1@example.com' },
        { text: 'Message 2', recipient: 'user2@example.com' },
      ],
    })

    notificationFake.assertDispatchedTimes(2)

    const invocations = notificationFake.getInvocations()
    expect(invocations).toHaveLength(2)
    expect(invocations[0].args[0]).toContain('Message 1')
    expect(invocations[1].args[0]).toContain('Message 2')
  })
})
```

### 5. Laravel-like Push Assertions

```typescript
// tests/functional/queue_controller.spec.ts
import { test } from '@japa/runner'
import { createJobFake } from '@adonisjs/job-testing-facade'
import ProcessDataJob from '#jobs/process_data'

test.group('Queue Controller', (group) => {
  let jobFake: ReturnType<typeof createJobFake>

  group.setup(() => {
    jobFake = createJobFake(ProcessDataJob)
  })

  group.teardown(() => {
    jobFake.restore()
  })

  test('should push job to correct queue', async ({ client }) => {
    await client.post('/process-data').json({
      data: { type: 'urgent', payload: 'test' },
    })

    // Using Laravel-like assertions
    jobFake.assertPushed()
    jobFake.assertPushedWith({ type: 'urgent', payload: 'test' })
    jobFake.assertPushedOn('high-priority')
    jobFake.assertPushedTimes(1)
  })

  test('should not push job when validation fails', async ({ client }) => {
    await client.post('/process-data').json({
      data: { invalid: 'data' },
    })

    jobFake.assertNotPushed()
  })
})
```

## Installation and Setup

### 1. Installation

```bash
npm install @adonisjs/job-testing-facade
```

### 2. Configuration (Optional)

```typescript
// config/job-testing.ts
export default {
  // Global options
  autoRestore: true,
  stubBehavior: 'resolve',
  defaultMethods: ['enqueue', 'dispatch', 'dispatchSync'],
}
```

### 3. Setup in Tests

```typescript
// tests/bootstrap.ts
import { restoreAllJobs } from '@adonisjs/job-testing-facade'

// Restore all jobs after each test
afterEach(() => {
  restoreAllJobs()
})
```

## Best Practices

### 1. Job Design for Testing

```typescript
// Good: Testable job structure
export default class WellStructuredJob {
  static async enqueue(data: any, options?: any) {
    // Enqueuing logic
  }

  async handle(data: any) {
    // Job handling logic
  }
}

// Bad: Hard to test
export default class PoorlyStructuredJob {
  constructor(private data: any) {}

  async run() {
    // Everything mixed together
  }
}
```

### 2. Testing Patterns

```typescript
// Good: Clear, focused tests
test('should send welcome email with correct data', async () => {
  const emailFake = createJobFake(WelcomeEmailJob)

  await controller.register(userData)

  emailFake.assertDispatchedWith(userData.email, userData.name)
  emailFake.restore()
})

// Bad: Testing multiple concerns
test('should handle registration completely', async () => {
  // Tests too many things at once
})
```

### 3. Test Isolation

```typescript
// Good: Proper cleanup
test.group('Job Tests', (group) => {
  group.setup(() => {
    // Setup fakes
  })

  group.teardown(() => {
    // Restore all fakes
    restoreAllJobs()
  })
})

// Bad: No cleanup
test('test without cleanup', async () => {
  const fake = createJobFake(MyJob)
  // No restore - will affect other tests
})
```

## Publishing the Package

### 1. Build and Test

```bash
npm run build
npm test
npm run lint
```

### 2. Publish to npm

```bash
npm publish
```

### 3. GitHub Release

Create a GitHub release with detailed changelog and migration guide.

## Complete Example Implementation

Here's a complete example of how to use this package in an AdonisJS application:

```typescript
// app/jobs/send_welcome_email.ts
import { enhanceJobWithFake } from '@adonisjs/job-testing-facade'

class SendWelcomeEmail {
  static async enqueue(email: string, name: string) {
    // Add to queue using your queue provider
    console.log(`Enqueuing welcome email for ${name} at ${email}`)
  }

  async handle(email: string, name: string) {
    // Send actual email
    console.log(`Sending welcome email to ${name} at ${email}`)
  }
}

export default enhanceJobWithFake(SendWelcomeEmail)

// app/controllers/auth_controller.ts
import SendWelcomeEmail from '#jobs/send_welcome_email'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const { fullName, email, password } = request.all()

    // Create user logic here

    // Enqueue welcome email
    await SendWelcomeEmail.enqueue(email, fullName)

    return response.json({ message: 'Registration successful' })
  }
}

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

  test('should send welcome email on registration', async ({ client }) => {
    await client.post('/register').json({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      passwordConfirmation: 'password123',
    })

    const emailFake = SendWelcomeEmail.fake()
    emailFake.assertDispatched()
    emailFake.assertDispatchedWith('john@example.com', 'John Doe')
    emailFake.assertDispatchedTimes(1)
  })
})
```

This comprehensive guide provides everything needed to implement and use the AdonisJS Job Testing Facade package with Laravel-like API and powerful testing capabilities.
