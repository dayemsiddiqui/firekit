import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import logger from '@adonisjs/core/services/logger'
import { LoginValidator } from '#validators/auth'

export default class AuthController {
  /**
   * Show login page
   */
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  /**
   * Handle login form submission
   */
  async login({ request, auth, response, session }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(LoginValidator)

      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      session.flash('success', 'Welcome back!')
      return response.redirect('/dashboard')
    } catch (error) {
      logger.error(error.message)
      session.flash('error', 'Invalid credentials')
      return response.redirect().back()
    }
  }

  /**
   * Show register page
   */
  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  /**
   * Handle register form submission
   */
  async register({ request, auth, response, session }: HttpContext) {
    const { fullName, email, password, passwordConfirmation } = request.only([
      'fullName',
      'email',
      'password',
      'passwordConfirmation',
    ])

    // Basic validation
    if (!email || !password || !passwordConfirmation) {
      session.flash('error', 'All fields are required.')
      return response.redirect('/register')
    }

    if (password !== passwordConfirmation) {
      session.flash('error', 'Passwords do not match.')
      return response.redirect('/register')
    }

    if (password.length < 6) {
      session.flash('error', 'Password must be at least 6 characters long.')
      return response.redirect('/register')
    }

    try {
      // Check if user already exists
      const existingUser = await User.findBy('email', email)
      if (existingUser) {
        session.flash('error', 'An account with this email already exists.')
        return response.redirect('/register')
      }

      const user = await User.create({
        fullName,
        email,
        password,
      })

      await auth.use('web').login(user)

      session.flash('success', 'Account created successfully!')
      return response.redirect('/dashboard')
    } catch (error) {
      console.error('Registration error:', error)
      session.flash('error', 'Failed to create account. Please try again.')
      return response.redirect('/register')
    }
  }

  /**
   * Show forget password page
   */
  async showForgetPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forget-password')
  }

  /**
   * Handle forget password form submission
   */
  async forgetPassword({ request, response, session }: HttpContext) {
    const { email } = request.only(['email'])

    try {
      const user = await User.findBy('email', email)

      if (!user) {
        session.flash('error', 'No account found with this email address')
        return response.redirect('/forget-password')
      }

      // TODO: Implement password reset email logic here
      // For now, just show a success message
      session.flash('success', 'Password reset instructions have been sent to your email')
      return response.redirect('/forget-password')
    } catch (error) {
      session.flash('error', 'Something went wrong. Please try again.')
      return response.redirect('/forget-password')
    }
  }

  /**
   * Handle logout
   */
  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Logged out successfully')
    return response.redirect('/login')
  }
}
