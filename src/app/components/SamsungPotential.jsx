'use client';


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SamsungPotential = () => {
  // Updated baseline energy consumption values per household
  const DEFAULT_VALUES = {
    ac: 5877, // kWh/year (baseline without smart mode)
    fridge: 1730, // kWh/year (baseline without smart mode)
    washer: 1826, // kWh/year (baseline without smart mode)
  };

  // Updated smart savings based on the provided data
  const SMART_SAVINGS = {
    ac: 1293, // kWh/year saved with smart mode
    fridge: 346, // kWh/year saved with smart mode
    washer: 274, // kWh/year saved with smart mode
  };

  // Carbon savings per device (kg CO2e/year)
  const CARBON_SAVINGS = {
    ac: 1061,
    fridge: 283,
    washer: 225
  };

  // Add this constant at the top with other constants
  const USD_TO_INR = 85;
  const CARBON_CREDIT_VALUE_USD = 30; // USD per ton CO2e
  const CARBON_CREDIT_VALUE = CARBON_CREDIT_VALUE_USD * USD_TO_INR; // Convert to INR

  const [marketData, setMarketData] = useState({
    // Single product segments
    acOnly: { customers: 100000, adoptionRate: 20 },
    fridgeOnly: { customers: 150000, adoptionRate: 25 },
    washerOnly: { customers: 80000, adoptionRate: 15 },
    
    // Two product combinations
    acFridge: { customers: 50000, adoptionRate: 30 },
    acWasher: { customers: 30000, adoptionRate: 20 },
    fridgeWasher: { customers: 40000, adoptionRate: 25 },
    
    // All products
    allProducts: { customers: 20000, adoptionRate: 35 }
  });

  const [projectionData, setProjectionData] = useState([]);

  const calculateSegmentSavings = (segment) => {
    let energySaved = 0;
    let carbonSaved = 0;

    // Calculate based on segment type
    if (segment.includes('ac')) {
      energySaved += SMART_SAVINGS.ac;
      carbonSaved += CARBON_SAVINGS.ac;
    }
    if (segment.includes('fridge')) {
      energySaved += SMART_SAVINGS.fridge;
      carbonSaved += CARBON_SAVINGS.fridge;
    }
    if (segment.includes('washer')) {
      energySaved += SMART_SAVINGS.washer;
      carbonSaved += CARBON_SAVINGS.washer;
    }

    // Convert carbon saved from kg to tons for carbon credit calculation
    const carbonSavedTons = carbonSaved / 1000;
    const carbonValue = carbonSavedTons * CARBON_CREDIT_VALUE;

    return { 
      energySaved,  // kWh/year
      carbonSaved: carbonSavedTons, // tons CO2e/year
      carbonValue // INR/year
    };
  };

  const calculateYearlyProjections = () => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    const projections = years.map(year => {
      const yearsSince2025 = year - 2025;
      let totalEnergySaved = 0;
      let totalCarbonSaved = 0;
      let totalCarbonValue = 0;
      let adoptedHouseholds = 0;

      // Calculate for each segment
      Object.entries(marketData).forEach(([segment, data]) => {
        const { adoptionRate, customers } = data;
        
        // Start with base adoption (100% of current customers in 2025)
        // Then add growth based on adoption rate for future years
        const baseAdoption = 100; // 100% of current customers
        const additionalAdoption = yearsSince2025 > 0 ? 
          Math.min(100, adoptionRate * Math.pow(1.1, yearsSince2025)) : 
          0;
        
        // Combine base and additional adoption
        const cumulativeAdoption = baseAdoption + additionalAdoption;
        const adoptedCustomers = customers * (cumulativeAdoption / 100);
        
        const { energySaved, carbonSaved, carbonValue } = calculateSegmentSavings(segment);

        totalEnergySaved += energySaved * adoptedCustomers;
        totalCarbonSaved += carbonSaved * adoptedCustomers;
        totalCarbonValue += carbonValue * adoptedCustomers;
        adoptedHouseholds += adoptedCustomers;
      });

      return {
        year,
        totalEnergySaved: totalEnergySaved / 1000, // Convert to MWh
        totalCarbonSaved,
        totalCarbonValue: totalCarbonValue / 1000000, // Convert to millions
        adoptedHouseholds,
        avgEnergySavedPerHousehold: adoptedHouseholds > 0 ? (totalEnergySaved / adoptedHouseholds) : 0,
        avgCarbonSavedPerHousehold: adoptedHouseholds > 0 ? (totalCarbonSaved / adoptedHouseholds) : 0
      };
    });

    setProjectionData(projections);
  };

  useEffect(() => {
    calculateYearlyProjections();
  }, [marketData]);

  const handleCustomerChange = (segment, value) => {
    setMarketData(prev => ({
      ...prev,
      [segment]: { ...prev[segment], customers: Number(value) }
    }));
  };

  const handleAdoptionChange = (segment, value) => {
    setMarketData(prev => ({
      ...prev,
      [segment]: { ...prev[segment], adoptionRate: value[0] }
    }));
  };

  // Format large numbers with commas
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  // Add this helper function
  const calculateGrowthPercentage = (value2030, value2027) => {
    if (!value2027) return 0;
    return ((value2030 - value2027) / value2027 * 100).toFixed(1);
  };

  return (
    <div className="w-full p-4">
      {/* Summary Statistics */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Total Households</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <span className="font-semibold">{formatNumber(projectionData[0]?.adoptedHouseholds || 0)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-green-600">{formatNumber(projectionData[5]?.adoptedHouseholds || 0)}</span>
              </div>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.toString().slice(2)}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                    width={30}
                  />
                  <Tooltip
                    formatter={(value) => [formatNumber(value), "Households"]}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="adoptedHouseholds"
                    stroke="#6366f1"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Energy Saving Per Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">
                {formatNumber(projectionData[2]?.avgEnergySavedPerHousehold || 0)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">
                {formatNumber(projectionData[5]?.avgEnergySavedPerHousehold || 0)} kWh
              </span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                projectionData[5]?.avgEnergySavedPerHousehold,
                projectionData[2]?.avgEnergySavedPerHousehold
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Total Energy Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">{formatNumber(projectionData[2]?.totalEnergySaved || 0)} MWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">{formatNumber(projectionData[5]?.totalEnergySaved || 0)} MWh</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                projectionData[5]?.totalEnergySaved,
                projectionData[2]?.totalEnergySaved
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Carbon Reduced Per Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">
                {formatNumber(projectionData[2]?.avgCarbonSavedPerHousehold || 0)} tons
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">
                {formatNumber(projectionData[5]?.avgCarbonSavedPerHousehold || 0)} tons
              </span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                projectionData[5]?.avgCarbonSavedPerHousehold,
                projectionData[2]?.avgCarbonSavedPerHousehold
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Total Carbon Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">{formatNumber(projectionData[2]?.totalCarbonSaved || 0)} tons</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">{formatNumber(projectionData[5]?.totalCarbonSaved || 0)} tons</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                projectionData[5]?.totalCarbonSaved,
                projectionData[2]?.totalCarbonSaved
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Carbon Credit Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">${formatNumber(projectionData[2]?.totalCarbonValue || 0)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">${formatNumber(projectionData[5]?.totalCarbonValue || 0)}M</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                projectionData[5]?.totalCarbonValue,
                projectionData[2]?.totalCarbonValue
              )}% growth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Left Side - Inputs */}
        <div className="w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Market Segments</CardTitle>
              <CardDescription>Enter customer base and adoption rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Products */}
              <div className="space-y-4">
                <h3 className="font-semibold">Single Product Segments</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* AC Only */}
                  <div className="space-y-4">
                    <div>
                      <Label>AC Only Customers</Label>
                      <Input
                        type="number"
                        value={marketData.acOnly.customers}
                        onChange={(e) => handleCustomerChange('acOnly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.acOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acOnly', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.acOnly.adoptionRate}%</p>
                    </div>
                  </div>

                  {/* Fridge Only */}
                  <div className="space-y-4">
                    <div>
                      <Label>Fridge Only Customers</Label>
                      <Input
                        type="number"
                        value={marketData.fridgeOnly.customers}
                        onChange={(e) => handleCustomerChange('fridgeOnly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.fridgeOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('fridgeOnly', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.fridgeOnly.adoptionRate}%</p>
                    </div>
                  </div>

                  {/* Washer Only */}
                  <div className="space-y-4">
                    <div>
                      <Label>Washer Only Customers</Label>
                      <Input
                        type="number"
                        value={marketData.washerOnly.customers}
                        onChange={(e) => handleCustomerChange('washerOnly', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.washerOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('washerOnly', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.washerOnly.adoptionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Product Combinations */}
              <div className="space-y-4">
                <h3 className="font-semibold">Two Product Combinations</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* AC + Fridge */}
                  <div className="space-y-4">
                    <div>
                      <Label>AC + Fridge Customers</Label>
                      <Input
                        type="number"
                        value={marketData.acFridge.customers}
                        onChange={(e) => handleCustomerChange('acFridge', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.acFridge.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acFridge', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.acFridge.adoptionRate}%</p>
                    </div>
                  </div>

                  {/* AC + Washer */}
                  <div className="space-y-4">
                    <div>
                      <Label>AC + Washer Customers</Label>
                      <Input
                        type="number"
                        value={marketData.acWasher.customers}
                        onChange={(e) => handleCustomerChange('acWasher', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.acWasher.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acWasher', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.acWasher.adoptionRate}%</p>
                    </div>
                  </div>

                  {/* Fridge + Washer */}
                  <div className="space-y-4">
                    <div>
                      <Label>Fridge + Washer Customers</Label>
                      <Input
                        type="number"
                        value={marketData.fridgeWasher.customers}
                        onChange={(e) => handleCustomerChange('fridgeWasher', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.fridgeWasher.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('fridgeWasher', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.fridgeWasher.adoptionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* All Products */}
              <div className="space-y-4">
                <h3 className="font-semibold">All Products</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Customers with All Products</Label>
                      <Input
                        type="number"
                        value={marketData.allProducts.customers}
                        onChange={(e) => handleCustomerChange('allProducts', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Adoption Rate YoY (%)</Label>
                      <Slider
                        value={[marketData.allProducts.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('allProducts', value)}
                      />
                      <p className="text-sm text-gray-500 mt-1">{marketData.allProducts.adoptionRate}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Charts */}
        <div className="w-2/3">
          <div className="grid grid-cols-2 gap-4">
            {/* Projection Charts */}
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Carbon Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatNumber(value)} tons`, "Carbon Saved"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCarbonSaved" 
                      stroke="#16a34a" 
                      name="Carbon Saved (tons CO2e)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Energy Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatNumber(value)} MWh`, "Energy Saved"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalEnergySaved" 
                      stroke="#2563eb" 
                      name="Energy Saved (MWh)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Carbon Credit Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => `$${(value/1).toFixed(1)}M`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`$${formatNumber(value)}M`, "Value"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalCarbonValue" 
                      stroke="#9333ea" 
                      name="Value (Million USD)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Households Adopted</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      formatter={(value) => [`${formatNumber(value)}`, "Households"]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="adoptedHouseholds" 
                      stroke="#dc2626" 
                      name="Number of Households"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Updated footnotes section */}
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <p className="italic">* All monetary values are in USD (1 USD = ₹85)</p>
            <p className="text-xs leading-relaxed">
              Current calculations use ${CARBON_CREDIT_VALUE_USD} per ton of carbon credits. It could reach as high as $93 per ton by the end of the decade. 
              Meanwhile, carbon prices in the EU are forecast to average €71 per ton ($76 per ton) this year, down from €85 per ton in 2023. 
              BNEF then projects the bloc's prices will head towards €149 per ton in 2030.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamsungPotential;