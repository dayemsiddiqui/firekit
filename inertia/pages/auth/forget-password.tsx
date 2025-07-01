import { Head, Link, useForm } from '@inertiajs/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { FormEvent } from 'react'

export default function ForgetPassword() {
  const { data, setData, post, processing, errors } = useForm({
    email: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    post('/forget-password')
  }

  return (
    <>
      <Head title="Forget Password - Firekit" />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">🔥 Firekit</h1>
            </Link>
            <h2 className="text-2xl font-semibold text-slate-800 mb-2">Reset your password</h2>
            <p className="text-slate-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Forget Password Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? 'Sending reset link...' : 'Send reset link'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:text-blue-500 hover:underline font-medium"
                >
                  Back to sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm text-slate-600 hover:text-slate-500 hover:underline"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Check your email</h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    If an account with that email exists, we'll send you password reset
                    instructions. The link will expire in 1 hour for security reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-slate-500">
              &copy; 2024 Firekit. Built with ❤️ using AdonisJS 6.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
