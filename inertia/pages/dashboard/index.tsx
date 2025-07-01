import { Head } from '@inertiajs/react'
import DashboardLayout from '../../components/layouts/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Separator } from '../../components/ui/separator'

interface User {
  id: number
  fullName: string | null
  email: string
  createdAt: string
}

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const stats = [
    {
      title: 'Total Projects',
      value: '12',
      change: '+2.5%',
      changeType: 'positive' as const,
      icon: '📂',
    },
    {
      title: 'Active Users',
      value: '1,234',
      change: '+12.3%',
      changeType: 'positive' as const,
      icon: '👥',
    },
    {
      title: 'Revenue',
      value: '$45,678',
      change: '+8.1%',
      changeType: 'positive' as const,
      icon: '💰',
    },
    {
      title: 'Conversion Rate',
      value: '3.24%',
      change: '-0.4%',
      changeType: 'negative' as const,
      icon: '📈',
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: 'New user registered',
      user: 'john.doe@example.com',
      time: '2 minutes ago',
      type: 'success',
    },
    {
      id: 2,
      action: 'Payment received',
      user: 'jane.smith@example.com',
      time: '5 minutes ago',
      type: 'success',
    },
    {
      id: 3,
      action: 'Login failed',
      user: 'suspicious@email.com',
      time: '8 minutes ago',
      type: 'warning',
    },
    {
      id: 4,
      action: 'Project created',
      user: 'developer@company.com',
      time: '12 minutes ago',
      type: 'info',
    },
  ]

  return (
    <DashboardLayout user={user}>
      <Head title="Dashboard - Firekit" />

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, {user.fullName || 'User'}! Here's what's happening today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
                <span className="text-2xl">{stat.icon}</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <Badge
                    variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                    className={`${
                      stat.changeType === 'positive'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {stat.change}
                  </Badge>
                  <span className="text-slate-500">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>📊</span>
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={activity.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === 'success'
                              ? 'bg-green-500'
                              : activity.type === 'warning'
                                ? 'bg-yellow-500'
                                : 'bg-blue-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-500">{activity.user}</p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                    {index < recentActivity.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>👤</span>
                <span>Account Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Full Name</label>
                <p className="text-sm text-slate-900">{user.fullName || 'Not set'}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-slate-600">Email</label>
                <p className="text-sm text-slate-900">{user.email}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-slate-600">Member Since</label>
                <p className="text-sm text-slate-900">{user.createdAt}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-slate-600">Status</label>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-medium text-slate-900">Create Project</h3>
                  <p className="text-sm text-slate-500">Start a new project</p>
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-medium text-slate-900">Invite Users</h3>
                  <p className="text-sm text-slate-500">Add team members</p>
                </div>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                <div className="text-center">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-medium text-slate-900">View Analytics</h3>
                  <p className="text-sm text-slate-500">Check performance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
