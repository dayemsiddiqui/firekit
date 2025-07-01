import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  /**
   * Show dashboard page
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return inertia.render('dashboard/index', {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt.toFormat('MMMM dd, yyyy'),
      },
    })
  }
}
