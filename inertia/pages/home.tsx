import { Head, Link } from '@inertiajs/react'
import { Button } from '../components/ui/button'

interface User {
  id: number
  fullName: string | null
  email: string
}

interface HomeProps {
  user?: User
}

export default function Home({ user }: HomeProps) {
  return (
    <>
      <Head title="Firekit - AdonisJS 6 Starter Kit" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-slate-900">🔥 Firekit</h1>
              </div>
              <div className="flex space-x-4">
                {user ? (
                  <>
                    <span className="text-sm text-slate-600 flex items-center">
                      Welcome, {user.fullName || 'User'}!
                    </span>
                    <Link href="/dashboard">
                      <Button>Dashboard</Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                    <Link href="/register">
                      <Button>Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 mb-6">
              Build with <span className="text-blue-600">AdonisJS 6</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              A modern, full-stack starter kit featuring AdonisJS 6, Inertia.js, React, and Tailwind
              CSS. Everything you need to build your next web application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-3">
                Start Building
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                View on GitHub
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Pre-configured with modern tools and best practices to get you started quickly.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">AdonisJS 6</h3>
                <p className="text-slate-600">
                  Latest version of the robust Node.js framework with TypeScript support and modern
                  features.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Inertia.js + React</h3>
                <p className="text-slate-600">
                  Build single-page apps with server-side routing and React components.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Tailwind CSS</h3>
                <p className="text-slate-600">
                  Utility-first CSS framework with shadcn/ui components for rapid UI development.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Authentication</h3>
                <p className="text-slate-600">
                  Pre-built authentication system with middleware and user management.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🗄️</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Database Ready</h3>
                <p className="text-slate-600">
                  Lucid ORM with migrations and models set up for quick database operations.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-slate-200 bg-slate-50">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚙️</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Development Tools</h3>
                <p className="text-slate-600">
                  Hot reload, TypeScript, ESLint, and testing setup for optimal developer
                  experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Getting Started Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Build?</h2>
            <p className="text-xl text-slate-300 mb-8">
              Get started with Firekit in just a few commands.
            </p>
            <div className="bg-slate-800 rounded-lg p-6 text-left max-w-2xl mx-auto mb-8">
              <code className="text-green-400">
                <div className="mb-2">git clone https://github.com/your-repo/firekit.git</div>
                <div className="mb-2">cd firekit</div>
                <div className="mb-2">npm install</div>
                <div>npm run dev</div>
              </code>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="text-slate-900 bg-white hover:bg-slate-100"
            >
              View Documentation
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center text-slate-600">
            <p>&copy; 2024 Firekit. Built with ❤️ using AdonisJS 6.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
