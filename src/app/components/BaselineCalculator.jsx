'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Move constants outside component
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const SMART_SAVINGS = {
  ac: 0.22, // 22% savings with AI mode
  fridge: 0.30, // Up to 30% savings (15% active + 15% standby)
  washing: 0.70  // Up to 70% savings on wash cycle
};

const BaselineCalculator = () => {
  // Form state
  const [formData, setFormData] = useState({
    roomCount: 2,
    familyMembers: 4,
    fridgeSize: 400, // liters
    acTonnage: 1.5, // tons
    washingMachineCapacity: 7, // kg
    useSmartAC: false,
    useSmartFridge: false,
    useSmartWashing: false,
    fridgeCount: 1,
    acCount: 1,
    washingMachineCount: 1
  });

  // Constants for calculations
  const ENERGY_FACTORS = {
    fridge: 0.004, // kWh per day per liter (1.5 kWh/100L/day)
    ac: {
      high: 1.5, // kWh per ton per hour for 1-1.5 ton
      medium: 1.2, // kWh per ton per hour
      low: 1.0 // kWh per ton per hour
    },
    washingMachine: 0.8 // kWh per kg per cycle
  };

  const AC_USAGE_PATTERNS = {
    high: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    medium: ['Mar', 'Nov'],
    low: ['Dec', 'Jan', 'Feb']
  };

  // Emission factor (kg CO2e per kWh) - example for India
  const EMISSION_FACTOR = 0.82;
  
  // Carbon credit market value (INR per metric ton CO2e)
  const CARBON_CREDIT_VALUE = 800;  // Indian carbon market price

  // State declarations
  const [monthlyData, setMonthlyData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [energyComparisonData, setEnergyComparisonData] = useState([]);
  const [annualSummary, setAnnualSummary] = useState({
    withoutAI: { energy: 0, emissions: 0 },
    withAI: { energy: 0, emissions: 0 }
  });

  // Define calculateDensityImpact first
  const calculateDensityImpact = useCallback(() => {
    const peoplePerRoom = formData.familyMembers / formData.roomCount;
    if (peoplePerRoom <= 2) return 1; // No impact
    
    // Calculate impact for extra people per room
    const extraPeoplePerRoom = peoplePerRoom - 2;
    const efficiencyReduction = extraPeoplePerRoom * 0.02; // 2% per extra person
    return 1 + efficiencyReduction; // Returns something like 1.02 for 2% reduction
  }, [formData.familyMembers, formData.roomCount]);

  // Then define calculateMonthlyEnergy
  const calculateMonthlyEnergy = useCallback((month, excludeAC = false) => {
    const densityImpact = calculateDensityImpact();
    
    // Fridge calculation (constant throughout year)
    const fridgeDaily = formData.fridgeSize * ENERGY_FACTORS.fridge; // kWh per day
    const fridgeMonthly = fridgeDaily * 30;
    let fridgeEnergy = fridgeMonthly * formData.fridgeCount * densityImpact;
    
    if (formData.useSmartFridge) {
      fridgeEnergy *= (1 - SMART_SAVINGS.fridge);
    }

    // AC calculation (varies by month)
    let acHoursPerDay = 0;
    if (AC_USAGE_PATTERNS.high.includes(month)) {
      acHoursPerDay = 8;
    } else if (AC_USAGE_PATTERNS.medium.includes(month)) {
      acHoursPerDay = 4;
    } else {
      acHoursPerDay = 1;
    }

    let acEnergyFactor;
    if (formData.acTonnage <= 1.5) {
      acEnergyFactor = ENERGY_FACTORS.ac.high;
    } else if (formData.acTonnage <= 2) {
      acEnergyFactor = 2.0;
    } else {
      acEnergyFactor = 2.5;
    }

    let acEnergy = formData.acTonnage * acEnergyFactor * acHoursPerDay * 30 * 
      formData.acCount * densityImpact;
    if (formData.useSmartAC) {
      acEnergy *= (1 - SMART_SAVINGS.ac);
    }

    // Washing machine calculation
    const washingCyclesPerMonth = formData.familyMembers * 8; // 8 cycles per person per month
    let washingEnergy = formData.washingMachineCapacity * 
      ENERGY_FACTORS.washingMachine * washingCyclesPerMonth * 
      formData.washingMachineCount * densityImpact;
    
    if (formData.useSmartWashing) {
      washingEnergy *= (1 - SMART_SAVINGS.washing);
    }

    const totalEnergy = fridgeEnergy + acEnergy + washingEnergy;
    return {
      totalEnergy,
      fridgeEnergy,
      acEnergy,
      washingEnergy,
      emissions: totalEnergy * EMISSION_FACTOR,
      densityImpact
    };
  }, [formData, calculateDensityImpact]);

  useEffect(() => {
    const newMonthlyData = MONTHS.map(month => {
      const data = calculateMonthlyEnergy(month);
      return {
        month,
        ...data
      };
    });

    setMonthlyData(newMonthlyData);

    // Calculate comparison data (baseline without AC vs projected)
    const comparisonData = MONTHS.map(month => {
      const baselineData = calculateMonthlyEnergy(month, true); // Exclude AC
      const projectedData = calculateMonthlyEnergy(month, false); // Include AC
      return {
        month,
        baseline: baselineData.emissions,
        projected: projectedData.emissions
      };
    });
    setComparisonData(comparisonData);

    // Calculate energy comparison data
    const energyComparisonData = MONTHS.map(month => {
      // Calculate baseline energy (without any AI savings)
      const baselineCalc = calculateMonthlyEnergy(month);
      let baselineEnergy = baselineCalc.fridgeEnergy + baselineCalc.acEnergy + baselineCalc.washingEnergy;

      // Calculate energy with AI savings
      let withAIEnergy = baselineEnergy;
      
      if (formData.useSmartFridge) {
        withAIEnergy -= baselineCalc.fridgeEnergy * SMART_SAVINGS.fridge;
      }
      if (formData.useSmartAC) {
        withAIEnergy -= baselineCalc.acEnergy * SMART_SAVINGS.ac;
      }
      if (formData.useSmartWashing) {
        withAIEnergy -= baselineCalc.washingEnergy * SMART_SAVINGS.washing;
      }
      
      return {
        month,
        baseline: Math.round(baselineEnergy),
        withAI: Math.round(withAIEnergy),
        savings: Math.round(baselineEnergy - withAIEnergy)
      };
    });
    setEnergyComparisonData(energyComparisonData);

    // Calculate annual summaries
    const calculateAnnualData = () => {
      let baselineAnnualEnergy = 0;
      let withAIAnnualEnergy = 0;

      MONTHS.forEach(month => {
        // Store original AI settings
        const originalSettings = {
          useSmartAC: formData.useSmartAC,
          useSmartFridge: formData.useSmartFridge,
          useSmartWashing: formData.useSmartWashing
        };

        // Calculate baseline (no AI)
        const baselineMonthly = calculateMonthlyEnergy(month);
        baselineAnnualEnergy += baselineMonthly.totalEnergy;

        // Calculate with current AI settings
        let withAIEnergy = baselineMonthly.fridgeEnergy;
        if (formData.useSmartFridge) {
          withAIEnergy -= baselineMonthly.fridgeEnergy * SMART_SAVINGS.fridge;
        }
        withAIEnergy += baselineMonthly.acEnergy;
        if (formData.useSmartAC) {
          withAIEnergy -= baselineMonthly.acEnergy * SMART_SAVINGS.ac;
        }
        withAIEnergy += baselineMonthly.washingEnergy;
        if (formData.useSmartWashing) {
          withAIEnergy -= baselineMonthly.washingEnergy * SMART_SAVINGS.washing;
        }
        withAIAnnualEnergy += withAIEnergy;
      });

      return {
        withoutAI: {
          energy: baselineAnnualEnergy,
          emissions: baselineAnnualEnergy * EMISSION_FACTOR
        },
        withAI: {
          energy: withAIAnnualEnergy,
          emissions: withAIAnnualEnergy * EMISSION_FACTOR
        }
      };
    };

    const annualData = calculateAnnualData();
    setAnnualSummary(annualData);
  }, [formData, calculateMonthlyEnergy]);

  return (
    <div className="w-full space-y-6">
      {/* Impact Card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
        <CardHeader>
          <CardTitle className="text-green-800">Environmental Impact of SmartThings AI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Carbon Savings</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(annualSummary.withoutAI.emissions - annualSummary.withAI.emissions)} kg
              </p>
              <p className="text-xs text-gray-500 mt-1">CO2e per year</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Energy Saved</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(annualSummary.withoutAI.energy - annualSummary.withAI.energy)} kWh
              </p>
              <p className="text-xs text-gray-500 mt-1">per year</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Trees Equivalent</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Math.round((annualSummary.withoutAI.emissions - annualSummary.withAI.emissions) / 20)}
              </p>
              <p className="text-xs text-gray-500 mt-1">annual absorption</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-sm text-gray-600">Cost Savings*</p>
              <p className="text-2xl font-bold text-amber-600">
                ₹{Math.round((annualSummary.withoutAI.energy - annualSummary.withAI.energy) * 8)}
              </p>
              <p className="text-xs text-gray-500 mt-1">*at ₹8/kWh</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm col-span-4">
              <p className="text-sm text-gray-600">Potential Carbon Credit Value</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-purple-600">
                  ₹{Math.round(((annualSummary.withoutAI.emissions - annualSummary.withAI.emissions) / 1000) * CARBON_CREDIT_VALUE)}
                </p>
                <p className="text-xs text-gray-500">at ₹{CARBON_CREDIT_VALUE}/ton CO2e</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Based on Indian carbon market price*</p>
              <p className="text-[10px] text-gray-400 mt-1">*Source: ICCAD analysis of Indian carbon market</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Without SmartThings AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg">Annual Energy Use: {Math.round(annualSummary.withoutAI.energy)} kWh</p>
              <p className="text-lg">Annual Carbon Emissions: {Math.round(annualSummary.withoutAI.emissions)} kg CO2e</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With SmartThings AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg">Energy Savings: {Math.round(annualSummary.withoutAI.energy - annualSummary.withAI.energy)} kWh</p>
              <p className="text-lg">Emission Reduction: {Math.round(annualSummary.withoutAI.emissions - annualSummary.withAI.emissions)} kg CO2e</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Household Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomCount">Number of Rooms</Label>
              <Input
                id="roomCount"
                type="number"
                value={formData.roomCount}
                onChange={(e) => setFormData({...formData, roomCount: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyMembers">Family Members</Label>
              <Input
                id="familyMembers"
                type="number"
                value={formData.familyMembers}
                onChange={(e) => setFormData({...formData, familyMembers: Number(e.target.value)})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appliances */}
      <Card>
        <CardHeader>
          <CardTitle>Appliances</CardTitle>
          <p className="text-sm text-gray-500 italic">
            Limitation of this tool: For multiple appliances, user will have different ratings. But as of now, please enter an average rating of all appliances if you want to enter multiple appliances
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Fridge */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="space-y-2">
                <Label htmlFor="fridgeSize">Refrigerator Size (Liters)</Label>
                <Input
                  id="fridgeSize"
                  type="number"
                  value={formData.fridgeSize}
                  onChange={(e) => setFormData({...formData, fridgeSize: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fridgeCount">Number of Units</Label>
                <Input
                  id="fridgeCount"
                  type="number"
                  min="1"
                  value={formData.fridgeCount}
                  onChange={(e) => setFormData({...formData, fridgeCount: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smartFridge"
                  checked={formData.useSmartFridge}
                  onCheckedChange={(checked) => setFormData({...formData, useSmartFridge: checked})}
                />
                <Label htmlFor="smartFridge">Use SmartThings AI (up to 30% savings)</Label>
              </div>
            </div>

            {/* AC */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="space-y-2">
                <Label htmlFor="acTonnage">AC Capacity (Tons)</Label>
                <Input
                  id="acTonnage"
                  type="number"
                  value={formData.acTonnage}
                  onChange={(e) => setFormData({...formData, acTonnage: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acCount">Number of Units</Label>
                <Input
                  id="acCount"
                  type="number"
                  min="1"
                  value={formData.acCount}
                  onChange={(e) => setFormData({...formData, acCount: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smartAC"
                  checked={formData.useSmartAC}
                  onCheckedChange={(checked) => setFormData({...formData, useSmartAC: checked})}
                />
                <Label htmlFor="smartAC">Use SmartThings AI (up to 22% savings)</Label>
              </div>
            </div>

            {/* Washing Machine */}
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="space-y-2">
                <Label htmlFor="washingMachineCapacity">Washing Machine Capacity (kg)</Label>
                <Input
                  id="washingMachineCapacity"
                  type="number"
                  value={formData.washingMachineCapacity}
                  onChange={(e) => setFormData({...formData, washingMachineCapacity: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="washingMachineCount">Number of Units</Label>
                <Input
                  id="washingMachineCount"
                  type="number"
                  min="1"
                  value={formData.washingMachineCount}
                  onChange={(e) => setFormData({...formData, washingMachineCount: Number(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="smartWashing"
                  checked={formData.useSmartWashing}
                  onCheckedChange={(checked) => setFormData({...formData, useSmartWashing: checked})}
                />
                <Label htmlFor="smartWashing">Use SmartThings AI (up to 70% savings)</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emission Factors Info */}
      <Alert>
        <AlertDescription>
          Calculations use an emission factor of {EMISSION_FACTOR} kg CO2e/kWh based on India&apos;s electricity grid mix:
          <br />- Coal-based power: ~70% of generation
          <br />- Renewable sources: ~20% of generation
          <br />- Other sources (nuclear, gas): ~10% of generation
        </AlertDescription>
      </Alert>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Monthly Emissions Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly CO2e Emissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar name="Fridge" dataKey="fridgeEnergy" fill="#818cf8" />
                  <Bar name="AC" dataKey="acEnergy" fill="#34d399" />
                  <Bar name="Washing Machine" dataKey="washingEnergy" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Energy Usage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Energy Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar name="Fridge" dataKey="fridgeEnergy" stackId="a" fill="#818cf8" />
                  <Bar name="AC" dataKey="acEnergy" stackId="a" fill="#34d399" />
                  <Bar name="Washing Machine" dataKey="washingEnergy" stackId="a" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calculation Theory */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding the Calculations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Monthly Energy Calculations</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Refrigerator:</strong> {formData.fridgeCount} unit(s) × {formData.fridgeSize}L × {ENERGY_FACTORS.fridge} kWh/100L × 30 days</p>
              <p><strong>Air Conditioner:</strong> {formData.acCount} unit(s) × {formData.acTonnage} tons × usage hours × {ENERGY_FACTORS.ac.high} kWh/ton × 30 days</p>
              <p><strong>Washing Machine:</strong> {formData.washingMachineCount} unit(s) × {formData.washingMachineCapacity} kg × {ENERGY_FACTORS.washingMachine} kWh/kg × {formData.familyMembers * 8} cycles</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">SmartThings AI Optimization</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>AC Savings ({SMART_SAVINGS.ac * 100}%):</strong> Achieved through smart scheduling, temperature optimization, and occupancy-based control</p>
              <p><strong>Refrigerator Savings ({SMART_SAVINGS.fridge * 100}%):</strong> Optimized through door monitoring, defrost cycles, and compressor efficiency</p>
              <p><strong>Washing Machine Savings ({SMART_SAVINGS.washing * 100}%):</strong> Realized via optimal load detection and cycle optimization</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Seasonal Variations</h3>
            <p className="text-sm text-gray-600">
              AC usage varies by season:
              <br />- High (Apr-Oct): 8 hours/day
              <br />- Medium (Mar, Nov): 4 hours/day
              <br />- Low (Dec-Feb): 1 hour/day
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Savings Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Energy Consumption Comparison</CardTitle>
          <p className="text-sm text-gray-600">Baseline vs SmartThings AI Energy Usage</p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={energyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-4 border rounded shadow-lg">
                        <p className="font-semibold">{label}</p>
                        <p className="text-gray-900">Baseline: {payload[0].value} kWh</p>
                        <p className="text-green-600">With AI: {payload[1].value} kWh</p>
                        <p className="text-blue-600">Savings: {payload[0].value - payload[1].value} kWh</p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Baseline Energy" 
                  dataKey="baseline" 
                  stroke="#171717" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  name="With SmartThings AI" 
                  dataKey="withAI" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Emissions Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Annual Emissions Comparison</CardTitle>
          <p className="text-sm text-gray-600">Baseline (without AC) vs Projected Emissions</p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: 'kg CO2e', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Baseline (No AC)" 
                  dataKey="baseline" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  name="Projected" 
                  dataKey="projected" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* References Section */}
      <Card>
        <CardHeader>
          <CardTitle>References</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              1. Samsung Newsroom. (2023, June 27). 
              <a 
                href="https://news.samsung.com/us/samsung-new-smartthings-energy-features-take-home-energy-management-next-level/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                New SmartThings Energy Features Take Home Energy Management to Next Level
              </a>
            </p>
            <p className="text-sm">
              2. Samsung Support. (2023, September 12). 
              <a 
                href="https://www.samsung.com/latin_en/support/home-appliances/how-to-save-energy-with-your-washing-machine/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Learn how to save up to 70% energy with your Samsung Washer and Washer Dryer
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BaselineCalculator;