import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

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
    const { email, password } = request.only(['email', 'password'])

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      session.flash('success', 'Welcome back!')
      return response.redirect('/dashboard')
    } catch (error) {
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
    const { fullName, email, password } = request.only(['fullName', 'email', 'password'])

    try {
      const user = await User.create({
        fullName,
        email,
        password,
      })

      await auth.use('web').login(user)

      session.flash('success', 'Account created successfully!')
      return response.redirect('/dashboard')
    } catch (error) {
      session.flash('error', 'Failed to create account. Please try again.')
      return response.redirect().back()
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
        return response.redirect().back()
      }

      // TODO: Implement password reset email logic here
      // For now, just show a success message
      session.flash('success', 'Password reset instructions have been sent to your email')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Something went wrong. Please try again.')
      return response.redirect().back()
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
