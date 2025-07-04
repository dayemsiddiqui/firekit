import vine from '@vinejs/vine'
import User from '#models/user'

export const LoginValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .exists({
        table: User.table,
        column: 'email',
        filter: (db, value, field) => {
          db.where('email', '!=', value)
        },
      }),
    password: vine.string().minLength(8),
  }),
)
