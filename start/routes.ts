/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

// Home route
router.get('/', async ({ inertia, auth }) => {
  const user = auth.user
  return inertia.render('home', { user })
})

// Authentication routes
const AuthController = () => import('#controllers/auth_controller')

// Show authentication pages (with guest middleware)
router
  .group(() => {
    router.get('/login', [AuthController, 'showLogin']).as('auth.show_login')
    router.get('/register', [AuthController, 'showRegister']).as('auth.show_register')
    router
      .get('/forget-password', [AuthController, 'showForgetPassword'])
      .as('auth.show_forget_password')
  })
  .use(middleware.guest())

// Handle authentication form submissions
router.post('/login', [AuthController, 'login']).as('auth.login')
router.post('/register', [AuthController, 'register']).as('auth.register')
router.post('/forget-password', [AuthController, 'forgetPassword']).as('auth.forget_password')

// Logout route
router.post('/logout', [AuthController, 'logout']).as('auth.logout')

// Protected dashboard routes
const DashboardController = () => import('#controllers/dashboard_controller')

router
  .group(() => {
    router.get('/dashboard', [DashboardController, 'index']).as('dashboard.index')
  })
  .use(middleware.auth())
