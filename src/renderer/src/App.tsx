import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { TimerPage } from '@renderer/timer/TimerPage'
import { HistoryPage } from '@renderer/history/HistoryPage'

export function App() {
  return (
    <div className="flex h-screen flex-col">
      <Tabs defaultValue="timer" className="flex flex-1 flex-col">
        <TabsList className="shrink-0 rounded-none border-b bg-card px-4">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="flex-1 overflow-auto">
          <TimerPage />
        </TabsContent>
        <TabsContent value="history" className="flex-1 overflow-auto">
          <HistoryPage />
        </TabsContent>
      </Tabs>
    </div>
  )
}
