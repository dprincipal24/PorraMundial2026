import { PredictionsNav } from '@/components/PredictionsNav'

export default function PredictionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PredictionsNav />
      {children}
    </div>
  )
}
