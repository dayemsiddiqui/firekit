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
}

/**
 * Job spy configuration options
 */
export interface JobSpyOptions {
  /**
   * Methods to spy on
   */
  methods?: string[]

  /**
   * Whether to restore spies automatically after each test
   */
  autoRestore?: boolean

  /**
   * Whether to stub the methods (prevent actual execution)
   */
  stub?: boolean

  /**
   * Custom behavior for stubbed methods
   */
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
  /**
   * Assert that the job was dispatched
   */
  assertDispatched(times?: number): this

  /**
   * Assert that the job was dispatched with specific arguments
   */
  assertDispatchedWith(...args: any[]): this

  /**
   * Assert that the job was dispatched a specific number of times
   */
  assertDispatchedTimes(times: number): this

  /**
   * Assert that the job was never dispatched
   */
  assertNotDispatched(): this

  /**
   * Assert that the job was dispatched with a callback
   */
  assertDispatchedWithCallback(callback: (args: any[]) => boolean): this

  /**
   * Get all invocations
   */
  getInvocations(): JobInvocation[]

  /**
   * Clear all invocations
   */
  clearInvocations(): this

  /**
   * Restore the original job methods
   */
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
  /**
   * Create a spy for a job
   */
  spy<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFake

  /**
   * Create a fake for a job (Laravel-like API)
   */
  fake<T extends JobConstructor>(job: T, options?: JobSpyOptions): JobFake

  /**
   * Restore all spies
   */
  restoreAll(): void

  /**
   * Clear all spies
   */
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

### 3. src/job_spy.ts

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
        // Store original method
        this.originalMethods.set(method, this.job[method])

        // Create spy or stub
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
      // Track invocation
      this.invocations.push({
        args: [...args],
        timestamp: new Date(),
        method,
      })

      // Call original if it exists
      if (originalCallsFake) {
        return originalCallsFake.call(spy, ...args)
      }

      // For stubs, return the configured behavior
      if (this.options.stub) {
        return this.executeStubBehavior(args)
      }

      // For spies, call the original method
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

      // Deep comparison for objects
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
import type { JobConstructor, JobSpyOptions, JobFake } from './types.js'
import { JobSpy } from './job_spy.js'

/**
 * Laravel-like job faker implementation
 */
export class JobFaker implements JobFake {
  private jobSpy: JobSpy

  constructor(job: JobConstructor, options?: JobSpyOptions) {
    this.jobSpy = new JobSpy(job, options)
  }

  // Delegate all methods to JobSpy
  assertDispatched(times?: number): this {
    this.jobSpy.assertDispatched(times)
    return this
  }

  assertDispatchedWith(...args: any[]): this {
    this.jobSpy.assertDispatchedWith(...args)
    return this
  }

  assertDispatchedTimes(times: number): this {
    this.jobSpy.assertDispatchedTimes(times)
    return this
  }

  assertNotDispatched(): this {
    this.jobSpy.assertNotDispatched()
    return this
  }

  assertDispatchedWithCallback(callback: (args: any[]) => boolean): this {
    this.jobSpy.assertDispatchedWithCallback(callback)
    return this
  }

  getInvocations() {
    return this.jobSpy.getInvocations()
  }

  clearInvocations(): this {
    this.jobSpy.clearInvocations()
    return this
  }

  restore(): this {
    this.jobSpy.restore()
    return this
  }

  // Additional Laravel-like methods
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
      // Assuming queue is passed as first argument or in options
      return args.some((arg) => typeof arg === 'object' && arg.queue === queue)
    })
  }

  assertPushedWithChain(jobs: any[]): this {
    return this.assertDispatchedWithCallback((args) => {
      // Custom logic for job chains
      return args.some(
        (arg) =>
          Array.isArray(arg) &&
          arg.length === jobs.length &&
          arg.every((job, index) => job.constructor === jobs[index])
      )
    })
  }
}
```

### 5. src/decorators.ts

```typescript
import type { JobMethodDecoratorOptions } from './types.js'

/**
 * Method decorator to enable testing for job methods
 */
export function testable(options: JobMethodDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      // Add testing metadata
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

      // Call original method
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

/**
 * Class decorator to make all methods testable
 */
export function testableJob(options: JobMethodDecoratorOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      static fake(fakeOptions?: any) {
        const { JobFaker } = require('./job_faker.js')
        return new JobFaker(this, fakeOptions)
      }

      static spy(spyOptions?: any) {
        const { JobSpy } = require('./job_spy.js')
        return new JobSpy(this, spyOptions)
      }
    }
  }
}
```

### 6. src/utils.ts

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

// Export everything
export { JobSpy, JobFaker, testable, testableJob, jobTestingFacade }
export type * from './types.js'

// Default export
export default jobTestingFacade
```

### 8. configure.ts

```typescript
import type { ApplicationService } from '@adonisjs/core/types'
import { configProvider } from '@adonisjs/core'

/**
 * Job testing facade configuration
 */
export default function configure(options: any = {}) {
  return {
    register(app: ApplicationService) {
      // Register job testing facade
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

### 2. Laravel-like API Usage

```typescript
// tests/functional/orders_controller.spec.ts
import { test } from '@japa/runner'
import ProcessOrderJob from '#jobs/process_order'
import SendOrderConfirmationJob from '#jobs/send_order_confirmation'

test.group('Orders Controller', (group) => {
  group.setup(() => {
    ProcessOrderJob.fake()
    SendOrderConfirmationJob.fake()
  })

  group.teardown(() => {
    ProcessOrderJob.restore()
    SendOrderConfirmationJob.restore()
  })

  test('should process order and send confirmation', async ({ client }) => {
    await client.post('/orders').json({
      items: [{ id: 1, quantity: 2 }],
      total: 99.99,
    })

    ProcessOrderJob.assertDispatched()
    ProcessOrderJob.assertDispatchedWith(expect.objectContaining({ total: 99.99 }))

    SendOrderConfirmationJob.assertDispatched()
    SendOrderConfirmationJob.assertDispatchedTimes(1)
  })

  test('should not process invalid orders', async ({ client }) => {
    await client.post('/orders').json({
      items: [],
      total: 0,
    })

    ProcessOrderJob.assertNotDispatched()
    SendOrderConfirmationJob.assertNotDispatched()
  })
})
```

### 3. Advanced Testing with Callbacks

```typescript
// tests/functional/notifications_controller.spec.ts
import { test } from '@japa/runner'
import SendNotificationJob from '#jobs/send_notification'

test.group('Notifications Controller', (group) => {
  group.setup(() => {
    SendNotificationJob.fake()
  })

  group.teardown(() => {
    SendNotificationJob.restore()
  })

  test('should send notification with correct priority', async ({ client }) => {
    await client.post('/notifications/urgent').json({
      message: 'System maintenance in 5 minutes',
      recipients: ['admin@example.com'],
    })

    SendNotificationJob.assertDispatchedWithCallback((args) => {
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

    SendNotificationJob.assertDispatchedTimes(2)

    const invocations = SendNotificationJob.getInvocations()
    expect(invocations).toHaveLength(2)
    expect(invocations[0].args[0]).toContain('Message 1')
    expect(invocations[1].args[0]).toContain('Message 2')
  })
})
```

### 4. Using Decorators

```typescript
// app/jobs/enhanced_job.ts
import { testableJob, testable } from '@adonisjs/job-testing-facade'

@testableJob()
export default class EnhancedJob {
  @testable({ trackInvocations: true })
  static async enqueue(data: any) {
    // Job enqueuing logic
  }

  @testable()
  async handle(data: any) {
    // Job handling logic
  }
}

// In tests
test('enhanced job with decorators', async () => {
  const jobFake = EnhancedJob.fake()

  await EnhancedJob.enqueue({ userId: 1 })

  jobFake.assertDispatched()
  jobFake.assertDispatchedWith({ userId: 1 })
})
```

## Testing the Package

### Test Structure

```typescript
// tests/job_spy.spec.ts
import { test } from '@japa/runner'
import { JobSpy } from '../src/job_spy.js'
import { SampleJob } from './fixtures/sample_jobs.js'

test.group('JobSpy', (group) => {
  let jobSpy: JobSpy

  group.setup(() => {
    jobSpy = new JobSpy(SampleJob)
  })

  group.teardown(() => {
    jobSpy.restore()
  })

  test('should create spy for job methods', async ({ assert }) => {
    await SampleJob.enqueue({ test: 'data' })

    jobSpy.assertDispatched()
    jobSpy.assertDispatchedWith({ test: 'data' })
  })

  test('should track multiple invocations', async ({ assert }) => {
    await SampleJob.enqueue({ test: 'data1' })
    await SampleJob.enqueue({ test: 'data2' })

    jobSpy.assertDispatchedTimes(2)

    const invocations = jobSpy.getInvocations()
    assert.lengthOf(invocations, 2)
    assert.include(invocations[0].args, { test: 'data1' })
    assert.include(invocations[1].args, { test: 'data2' })
  })
})
```

## Installation and Setup

### 1. Installation

```bash
npm install @adonisjs/job-testing-facade
```

### 2. Configuration

```typescript
// config/job-testing.ts
import { defineConfig } from '@adonisjs/job-testing-facade'

export default defineConfig({
  // Global options
  autoRestore: true,
  stubBehavior: 'resolve',
  defaultMethods: ['enqueue', 'dispatch', 'dispatchSync'],
})
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

## Publishing Guide

### 1. Pre-publish Checklist

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Documentation is complete
- [ ] CHANGELOG is updated
- [ ] Version is bumped in package.json
- [ ] Build files are generated

### 2. Publishing Steps

```bash
# Build the package
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Publish to npm
npm publish
```

### 3. Post-publish

- [ ] Create GitHub release
- [ ] Update documentation
- [ ] Announce on social media
- [ ] Update AdonisJS documentation

## Best Practices

### 1. Job Design

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
  const emailFake = WelcomeEmailJob.fake()

  await controller.register(userData)

  emailFake.assertDispatchedWith(userData.email, userData.name)
})

// Bad: Testing multiple concerns
test('should handle registration completely', async () => {
  // Tests too many things at once
})
```

### 3. Error Handling

```typescript
// Good: Specific error assertions
test('should handle job enqueue failure', async () => {
  const jobFake = SomeJob.fake({ stubBehavior: 'reject' })

  await assert.rejects(() => controller.processRequest(), /Job enqueue failed/)
})
```

## Advanced Features

### 1. Custom Assertion Methods

```typescript
// Extend the JobFaker class
class CustomJobFaker extends JobFaker {
  assertDispatchedToQueue(queueName: string): this {
    return this.assertDispatchedWithCallback((args) => {
      return args.some((arg) => arg.queue === queueName)
    })
  }

  assertDispatchedWithDelay(delayMs: number): this {
    return this.assertDispatchedWithCallback((args) => {
      return args.some((arg) => arg.delay === delayMs)
    })
  }
}
```

### 2. Integration with Other Testing Libraries

```typescript
// Jest integration
import { createJobFake } from '@adonisjs/job-testing-facade'

const jobFake = createJobFake(MyJob)

// Use Jest expectations
expect(jobFake.getInvocations()).toHaveLength(1)
expect(jobFake.getInvocations()[0].args).toEqual([expectedData])
```

### 3. Performance Testing

```typescript
test('should handle job enqueuing performance', async () => {
  const jobFake = BulkJob.fake()

  const start = Date.now()
  await controller.processBulkData(largeDataSet)
  const duration = Date.now() - start

  jobFake.assertDispatchedTimes(expectedJobCount)
  expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
})
```

## Troubleshooting

### Common Issues

1. **Jobs not being intercepted**
   - Ensure the job class has the correct methods
   - Check that the spy is set up before the job is called
   - Verify that the job is being imported correctly

2. **Assertion failures**
   - Check argument comparison logic
   - Ensure proper restoration of spies
   - Verify test isolation

3. **TypeScript errors**
   - Ensure proper type imports
   - Check that job classes implement expected interfaces
   - Verify generic type parameters

### Debug Tips

```typescript
// Add debugging to see what's happening
test('debug job calls', async () => {
  const jobFake = MyJob.fake()

  await controller.doSomething()

  // Debug output
  console.log('Invocations:', jobFake.getInvocations())
  console.log(
    'Spy calls:',
    jobFake.getInvocations().map((i) => i.args)
  )

  jobFake.assertDispatched()
})
```

This comprehensive guide provides everything needed to implement the AdonisJS Job Testing Facade package. The implementation includes a Laravel-like API, comprehensive testing capabilities, and follows TypeScript best practices throughout.
