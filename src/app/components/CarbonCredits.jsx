import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeafyGreen, BarChart3, TrendingUp, ClipboardCheck, DollarSign } from 'lucide-react';
import BaselineCalculator from './BaselineCalculator';
import SamsungPotential from './SamsungPotential';
const CarbonCredits = () => {
  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-2">Carbon Credits Calculator</h1>
      <p className="text-muted-foreground mb-6">
        Calculate, forecast, and track your carbon credit potential
      </p>
      
      <Tabs defaultValue="theory" className="w-full">
        <TabsList className="grid grid-cols-5 mb-8">
          <TabsTrigger value="theory" className="flex items-center gap-2">
            <LeafyGreen className="w-4 h-4" />
            <span>Theory</span>
          </TabsTrigger>
          <TabsTrigger value="baseline" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span>Baseline</span>
          </TabsTrigger>
          
          <TabsTrigger value="value" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Samsung Potential</span>
          </TabsTrigger>

          <TabsTrigger value="forecasts" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>How it will work</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="theory">
          <Card>
            <CardHeader>
              <CardTitle>Understanding Carbon Credits</CardTitle>
              <CardDescription>Learn about carbon credit fundamentals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertDescription>
                  One carbon credit equals one metric ton of carbon dioxide equivalent (CO2e) that is either prevented from being emitted or removed from the atmosphere.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Key Concepts</h3>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Additionality</CardTitle>
                    </CardHeader>
                    <CardContent>
                      Carbon credit projects must demonstrate that their emission reductions would not have occurred without the project.
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Permanence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      The emission reductions must be long-lasting and not easily reversed.
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="baseline">
          <BaselineCalculator />
        </TabsContent>

        <TabsContent value="forecasts">
          <div className="mb-4">
            <img 
              src="/samsung_role.png" 
              alt="Samsung's Role in Carbon Credits" 
              className="w-full rounded-lg shadow-md"
            />
          </div>
        </TabsContent>

        <TabsContent value="verification">
          <Card>
            <CardHeader>
              <CardTitle>Verification Process</CardTitle>
              <CardDescription>Track and verify your emission reductions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-standard">Verification Standard</Label>
                  <Select>
                    <SelectTrigger id="verification-standard">
                      <SelectValue placeholder="Select standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vcs">Verified Carbon Standard (VCS)</SelectItem>
                      <SelectItem value="gs">Gold Standard</SelectItem>
                      <SelectItem value="cdm">Clean Development Mechanism (CDM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification-frequency">Verification Frequency</Label>
                  <Select>
                    <SelectTrigger id="verification-frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="biannual">Bi-annual</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full">Start Verification Process</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="value">
          <SamsungPotential />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarbonCredits;