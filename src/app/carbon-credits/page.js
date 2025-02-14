import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CarbonCredits from '../components/CarbonCredits'

export default function CarbonCreditsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Carbon Credits Calculator</h1>
      <CarbonCredits />
    </main>
  )
}
