import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function DashboardWidget({ icon: Icon, title, badge, headerRight, headerExtra, children, className, contentClassName }) {
  return (
    <Card className={cn("h-[500px] flex flex-col border-white/70 dark:border-fuchsia-300/10", className)}>
      <CardHeader className="cute-panel-header shrink-0 min-h-[64px] pb-2 border-b border-fuchsia-100/80 dark:border-white/8 justify-center">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100">
            {Icon && <Icon className="w-4 h-4 text-fuchsia-500 dark:text-pink-300" />}
            {title}
            {badge}
          </span>
          {headerRight}
        </CardTitle>
        {headerExtra}
      </CardHeader>
      <CardContent className={cn("flex-1 overflow-y-auto overflow-x-hidden pt-0", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
