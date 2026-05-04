import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { TimerPage } from '@renderer/timer/TimerPage'
import { HistoryPage } from '@renderer/history/HistoryPage'

export function App() {
  return (
    <Tabs defaultValue="timer" className="flex h-screen flex-col">
      <div className="flex h-10 shrink-0 items-center border-b border-border/60 bg-card/60 px-4">
        <div className="mr-auto flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground/50">
            Work Timer
          </span>
        </div>
        <TabsList className="h-auto gap-0.5 bg-transparent p-0">
          <TabsTrigger
            value="timer"
            className="h-7 rounded px-3 text-xs font-medium tracking-wide transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground/50 data-[state=inactive]:shadow-none hover:text-muted-foreground"
          >
            Timer
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="h-7 rounded px-3 text-xs font-medium tracking-wide transition-colors data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=inactive]:text-muted-foreground/50 data-[state=inactive]:shadow-none hover:text-muted-foreground"
          >
            History
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="timer" className="mt-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
        <TimerPage />
      </TabsContent>
      <TabsContent value="history" className="mt-0 flex-1 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
        <HistoryPage />
      </TabsContent>
    </Tabs>
  )
}
