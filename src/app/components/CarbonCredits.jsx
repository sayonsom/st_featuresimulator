'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CarbonCredits = () => {
  const ADOPTION_SCENARIOS = {
    'Conservative Growth': 0.05,
    'Steady Adoption': 0.20,
    'Moderate Success': 0.33,
    'Strong Growth': 0.50,
    'Rapid Adoption': 0.70,
    'Market Leadership': 0.80
  };

  // Add state for selected scenario
  const [selectedScenario, setSelectedScenario] = useState('Moderate Success');

  // State for historical data (2022-2025) with default values
  const [historicalData, setHistoricalData] = useState({
    AC: { 2022: 5, 2023: 7, 2024: 10, 2025: 12 }, // Values in 100,000s
    FRIDGE: { 2022: 8, 2023: 10, 2024: 13, 2025: 15 },
    WASHING_MACHINE: { 2022: 6, 2023: 8, 2024: 11, 2025: 14 }
  });

  // Default annual energy savings per appliance type (in kWh)
  const APPLIANCE_INFO = {
    AC: {
      standardUsage: '1,000-3,000',
      defaultSavings: 250, // middle of 200-300 range
      savingsRange: '200-300',
      aiDescription: 'Uses occupancy sensors, weather forecasts, and usage patterns to optimize cooling/heating cycles.'
    },
    FRIDGE: {
      standardUsage: '400-600',
      defaultSavings: 125, // middle of 100-150 range
      savingsRange: '100-150',
      aiDescription: 'Optimizes cooling cycles, reduces defrost frequency, and adjusts settings based on usage/door openings.'
    },
    WASHING_MACHINE: {
      standardUsage: '300-500',
      defaultSavings: 75, // middle of 50-100 range
      savingsRange: '50-100',
      aiDescription: 'Adjusts water levels, cycle duration, and temperature based on load size and fabric type (e.g., EcoBubble™ tech).'
    }
  };

  // State for energy savings per appliance (kWh/year)
  const [applianceSavings, setApplianceSavings] = useState({
    AC: APPLIANCE_INFO.AC.defaultSavings,
    FRIDGE: APPLIANCE_INFO.FRIDGE.defaultSavings,
    WASHING_MACHINE: APPLIANCE_INFO.WASHING_MACHINE.defaultSavings
  });

  // State for efficiency gains and growth rates
  const [efficiencyGains, setEfficiencyGains] = useState({
    AC: 5, // 5% annual efficiency improvement
    FRIDGE: 3,
    WASHING_MACHINE: 4
  });

  const [growthRates, setGrowthRates] = useState({
    AC: 15, // 15% annual growth
    FRIDGE: 12,
    WASHING_MACHINE: 10
  });

  // State for forecasted data
  const [forecastData, setForecastData] = useState([]);
  
  // Carbon credit values
  const CARBON_CREDIT_VALUE = 30; // USD per metric ton of CO2
  const ENERGY_TO_CARBON = 0.0005; // Metric tons of CO2 per kWh (example conversion rate)

  // Calculate forecast including scenarios
  const calculateForecast = () => {
    const appliances = ['AC', 'FRIDGE', 'WASHING_MACHINE'];
    let forecast = [];
    
    // Calculate for years 2026-2030
    for (let year = 2026; year <= 2030; year++) {
      let yearData = { year };
      const adoptionRate = ADOPTION_SCENARIOS[selectedScenario];
      
      appliances.forEach(appliance => {
        // Calculate user growth (values are in 100,000s)
        const lastYear = historicalData[appliance][2025] * 100000; // Convert to actual users
        const growth = 1 + (growthRates[appliance] / 100);
        const efficiency = 1 + (efficiencyGains[appliance] / 100);
        
        const users = lastYear * Math.pow(growth, year - 2025);
        // Apply adoption rate to energy savings
        const savings = users * applianceSavings[appliance] * Math.pow(efficiency, year - 2025) * adoptionRate;
        
        yearData[`${appliance}_Users`] = Math.round(users);
        yearData[`${appliance}_Savings`] = Math.round(savings);
        yearData[`${appliance}_Carbon`] = savings * ENERGY_TO_CARBON;
      });
      
      yearData.totalCarbon = appliances.reduce((sum, appliance) => 
        sum + yearData[`${appliance}_Carbon`], 0
      );
      
      forecast.push(yearData);
    }
    
    setForecastData(forecast);
  };

  // Prepare chart data
  const prepareChartData = () => {
    const years = [2022, 2023, 2024, 2025];
    return years.map(year => ({
      year,
      AC: historicalData.AC[year],
      FRIDGE: historicalData.FRIDGE[year],
      WASHING_MACHINE: historicalData.WASHING_MACHINE[year]
    }));
  };

  // Calculate total carbon credits
  const calculateTotalCarbon = () => {
    if (!forecastData.length) return 0;
    return forecastData.reduce((acc, year) => 
      acc + year.AC_Carbon + year.FRIDGE_Carbon + year.WASHING_MACHINE_Carbon, 0);
  };

  return (
    <div className="p-4 space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Samsung Appliance Energy Savings Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {/* Historical Data Inputs */}
          <div className="grid grid-cols-3 gap-8 mb-6 w-full">
            {['AC', 'FRIDGE', 'WASHING_MACHINE'].map(appliance => (
              <div key={appliance} className="space-y-4">
                <h3 className="font-semibold">{appliance.replace('_', ' ')}</h3>
                {[2022, 2023, 2024, 2025].map(year => (
                  <div key={year} className="flex items-center gap-2">
                    <Label>{year}:</Label>
                    <div className="flex items-center">
                      <Input 
                        type="number"
                        value={historicalData[appliance][year]}
                        onChange={(e) => setHistoricalData(prev => ({
                          ...prev,
                          [appliance]: {
                            ...prev[appliance],
                            [year]: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-32"
                      />
                      <span className="ml-2 text-sm text-gray-500">x 100,000</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Energy Savings & Growth Inputs */}
          <div className="grid grid-cols-3 gap-8 mb-6 w-full">
            {['AC', 'FRIDGE', 'WASHING_MACHINE'].map(appliance => (
              <div key={appliance} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="block mb-2">AI Energy Savings (kWh/year/unit):</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={applianceSavings[appliance]}
                        onChange={(e) => setApplianceSavings(prev => ({
                          ...prev,
                          [appliance]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-32"
                      />
                      <div className="text-sm text-gray-600">
                        Recommended range: {APPLIANCE_INFO[appliance].savingsRange} kWh
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="font-medium mb-1">Standard Usage: {APPLIANCE_INFO[appliance].standardUsage} kWh/year</div>
                    <div className="text-gray-600">
                      <span className="font-medium">How AI Helps:</span> {APPLIANCE_INFO[appliance].aiDescription}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Efficiency Gain (%):</Label>
                  <Input
                    type="number"
                    value={efficiencyGains[appliance]}
                    onChange={(e) => setEfficiencyGains(prev => ({
                      ...prev,
                      [appliance]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label>Growth Rate (%):</Label>
                  <Input
                    type="number"
                    value={growthRates[appliance]}
                    onChange={(e) => setGrowthRates(prev => ({
                      ...prev,
                      [appliance]: parseFloat(e.target.value) || 0
                    }))}
                    className="w-32"
                  />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={calculateForecast}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
          >
            Calculate Forecast
          </button>

          {/* Charts - Now in separate rows */}
          <div className="space-y-8 w-full">
            {/* Historical Users Chart */}
            <Card className="p-4 w-full">
              <CardHeader>
                <CardTitle>Historical Users</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="AC" stroke="#8884d8" />
                    <Line type="monotone" dataKey="FRIDGE" stroke="#82ca9d" />
                    <Line type="monotone" dataKey="WASHING_MACHINE" stroke="#ffc658" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Forecast Chart */}
            <Card className="p-4 w-full">
              <CardHeader>
                <CardTitle>Energy Savings Forecast</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="AC_Savings" fill="#8884d8" />
                    <Bar dataKey="FRIDGE_Savings" fill="#82ca9d" />
                    <Bar dataKey="WASHING_MACHINE_Savings" fill="#ffc658" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Carbon Credits Summary */}
          <Card className="mt-6 p-4 w-full">
            <CardHeader>
              <CardTitle>Carbon Credits Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>Total Carbon Savings: {calculateTotalCarbon().toFixed(2)} metric tons CO2</p>
                <p>Estimated Carbon Credit Value: ${(calculateTotalCarbon() * CARBON_CREDIT_VALUE).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Carbon Market Requirements */}
          <Card className="mt-6 p-4 w-full">
            <CardHeader>
              <CardTitle>Carbon Market Participation Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Minimum Volume Requirements</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Voluntary Carbon Market (VCM): Typically 1,000 metric tons CO2e per year</li>
                    <li>Compliance Markets: Often higher, around 25,000 metric tons CO2e per year</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Financial Considerations</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Project Development Costs: $50,000 - $100,000 for documentation and verification</li>
                    <li>Annual Verification Costs: $15,000 - $25,000</li>
                    <li>Current Market Prices: $20 - $100 per metric ton, varying by project type and quality</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Timeline and Process</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Project Development: 6-12 months</li>
                    <li>Verification Process: 2-3 months</li>
                    <li>Credit Issuance: 1-2 months after verification</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Key Requirements</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Additionality: Projects must demonstrate they wouldn't happen without carbon finance</li>
                    <li>Monitoring: Robust measurement and reporting systems required</li>
                    <li>Third-party Verification: Annual verification by accredited bodies</li>
                    <li>Documentation: Detailed project design documents and monitoring plans</li>
                  </ul>
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  Note: These requirements and costs are indicative and can vary by market, jurisdiction, and project type. 
                  Smaller projects often participate through aggregators who bundle multiple small projects together to meet minimum requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarbonCredits;