import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProductionStats, useOrders, useCustomers } from '@/lib/hooks'
import { ChartLine, Package, Users, Clock, CheckCircle, Hourglass, FileText } from '@phosphor-icons/react'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  description?: string
  color?: string
}

function StatCard({ title, value, icon, description, color = 'text-foreground' }: StatCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatusRowProps {
  label: string
  count: number
  total: number
  color: string
}

function StatusRow({ label, count, total, color }: StatusRowProps) {
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{count.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground w-12 text-right">{percentage}%</span>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { stats: productionStats, loading: statsLoading } = useProductionStats()
  const { total: ordersTotal, loading: ordersLoading } = useOrders({ limit: 1 })
  const { total: customersTotal, loading: customersLoading } = useCustomers({ limit: 1 })

  const isLoading = statsLoading || ordersLoading || customersLoading

  // Calculate metrics
  const totalOrders = productionStats?.total || 0
  const inProduction = (productionStats?.screenprint || 0) +
                       (productionStats?.embroidery || 0) +
                       (productionStats?.dtg || 0)
  const pendingOrders = (productionStats?.quote || 0) +
                        (productionStats?.art || 0) +
                        (productionStats?.fulfillment || 0)
  const completedOrders = productionStats?.complete || 0
  const completionRate = totalOrders > 0
    ? ((completedOrders / totalOrders) * 100).toFixed(1)
    : '0'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ChartLine weight="bold" className="w-5 h-5" />
            Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Production overview and statistics
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading reports...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              title="Total Orders"
              value={totalOrders}
              icon={<Package weight="bold" className="w-6 h-6" />}
              description="All time"
            />
            <StatCard
              title="In Production"
              value={inProduction}
              icon={<Hourglass weight="bold" className="w-6 h-6" />}
              color="text-yellow-400"
              description="SP, EMB, DTG"
            />
            <StatCard
              title="Completed"
              value={completedOrders}
              icon={<CheckCircle weight="bold" className="w-6 h-6" />}
              color="text-green-400"
              description={`${completionRate}% completion rate`}
            />
            <StatCard
              title="Customers"
              value={customersTotal}
              icon={<Users weight="bold" className="w-6 h-6" />}
              description="Total accounts"
            />
          </div>

          {/* Production Status Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-card border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock weight="bold" className="w-4 h-4" />
                  Order Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <StatusRow
                  label="Quotes"
                  count={productionStats?.quote || 0}
                  total={totalOrders}
                  color="bg-gray-400"
                />
                <StatusRow
                  label="Art Approval"
                  count={productionStats?.art || 0}
                  total={totalOrders}
                  color="bg-purple-400"
                />
                <StatusRow
                  label="Screen Print"
                  count={productionStats?.screenprint || 0}
                  total={totalOrders}
                  color="bg-emerald-400"
                />
                <StatusRow
                  label="Embroidery"
                  count={productionStats?.embroidery || 0}
                  total={totalOrders}
                  color="bg-blue-400"
                />
                <StatusRow
                  label="DTG"
                  count={productionStats?.dtg || 0}
                  total={totalOrders}
                  color="bg-orange-400"
                />
                <StatusRow
                  label="Fulfillment"
                  count={productionStats?.fulfillment || 0}
                  total={totalOrders}
                  color="bg-yellow-400"
                />
                <StatusRow
                  label="Complete"
                  count={productionStats?.complete || 0}
                  total={totalOrders}
                  color="bg-green-400"
                />
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card border-border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText weight="bold" className="w-4 h-4" />
                  Quick Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Active Orders</p>
                  <p className="text-xl font-semibold mt-1">
                    {(totalOrders - completedOrders).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Orders not yet complete
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending Production</p>
                  <p className="text-xl font-semibold mt-1 text-yellow-400">
                    {pendingOrders.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Quotes + Art + Fulfillment
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">In Production</p>
                  <p className="text-xl font-semibold mt-1 text-blue-400">
                    {inProduction.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Screen Print + Embroidery + DTG
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for future reports */}
          <Card className="bg-card/50 border-border border-dashed">
            <CardContent className="py-8 text-center">
              <ChartLine weight="bold" className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Revenue reports and customer analytics coming soon
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pending API endpoints in ronny-ops
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
