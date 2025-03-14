'use client';


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Move this outside the component to avoid recreating it on every render
const USD_TO_INR = 85;
const CARBON_CREDIT_VALUE_USD = 30; // USD per ton CO2e
const CARBON_CREDIT_VALUE = CARBON_CREDIT_VALUE_USD * USD_TO_INR; // Convert to INR

// Move the calculation function outside the component
const calculateSegmentSavings = (segment, SMART_SAVINGS, CARBON_SAVINGS) => {
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

  const [marketData, setMarketData] = useState({
    // Single product segments
    acOnly: { customers: 123580, adoptionRate: 5, aiModeUsage: 50 },
    fridgeOnly: { customers: 139013, adoptionRate: 5, aiModeUsage: 50 },
    washerOnly: { customers: 284178, adoptionRate: 5, aiModeUsage: 50 },
    
    // Two product combinations
    acFridge: { customers: 49288, adoptionRate: 5, aiModeUsage: 50 },
    acWasher: { customers: 40750, adoptionRate: 5, aiModeUsage: 50 },
    fridgeWasher: { customers: 13140, adoptionRate: 5, aiModeUsage: 50 },
    
    // All products
    allProducts: { customers: 24450, adoptionRate: 5, aiModeUsage: 50 }
  });

  const [projectionData, setProjectionData] = useState([]);

  // Memoize the handlers to prevent unnecessary re-renders
  const handleCustomerChange = useCallback((segment, value) => {
    setMarketData(prev => ({
      ...prev,
      [segment]: { ...prev[segment], customers: Number(value) }
    }));
  }, []);

  const handleAdoptionChange = useCallback((segment, value) => {
    setMarketData(prev => ({
      ...prev,
      [segment]: { ...prev[segment], adoptionRate: value[0] }
    }));
  }, []);

  const handleAIModeChange = useCallback((segment, value) => {
    setMarketData(prev => ({
      ...prev,
      [segment]: { ...prev[segment], aiModeUsage: value[0] }
    }));
  }, []);

  const calculateYearlyProjections = useCallback(() => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030];
    const projections = years.map(year => {
      const yearsSince2025 = year - 2025;
      let totalEnergySaved = 0;
      let totalCarbonSaved = 0;
      let totalCarbonValue = 0;
      let adoptedHouseholds = 0;

      // Calculate for each segment
      Object.entries(marketData).forEach(([segment, data]) => {
        const { adoptionRate, customers, aiModeUsage } = data;
        
        // Start with base adoption (100% of current customers in 2025)
        // Then add growth based on adoption rate for future years
        const baseAdoption = 100; // 100% of current customers
        const additionalAdoption = yearsSince2025 > 0 ? 
          Math.min(100, adoptionRate * Math.pow(1.1, yearsSince2025)) : 
          0;
        
        // Combine base and additional adoption
        const cumulativeAdoption = baseAdoption + additionalAdoption;
        
        // Calculate total adopted customers and then apply AI mode usage percentage
        const totalAdoptedCustomers = customers * (cumulativeAdoption / 100);
        const aiModeCustomers = totalAdoptedCustomers * (aiModeUsage / 100);
        
        // Only calculate savings for customers using AI mode
        const { energySaved, carbonSaved, carbonValue } = calculateSegmentSavings(segment, SMART_SAVINGS, CARBON_SAVINGS);
        
        totalEnergySaved += energySaved * aiModeCustomers;
        totalCarbonSaved += carbonSaved * aiModeCustomers;
        totalCarbonValue += carbonValue * aiModeCustomers;
        adoptedHouseholds += aiModeCustomers; // Only count households using AI mode
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

    return projections;
  }, [marketData]);

  // Use a stable dependency array to prevent infinite loops
  useEffect(() => {
    const projections = calculateYearlyProjections();
    setProjectionData(projections);
  }, [calculateYearlyProjections]);

  // Format large numbers with commas
  const formatNumber = useCallback((num) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  }, []);

  // Add this helper function
  const calculateGrowthPercentage = useCallback((value2030, value2027) => {
    if (!value2027) return 0;
    return ((value2030 - value2027) / value2027 * 100).toFixed(1);
  }, []);

  // Memoize the initial render of projection data to prevent infinite loops
  const initialProjectionData = useMemo(() => {
    return projectionData.length > 0 ? projectionData : Array(6).fill({
      year: 0,
      totalEnergySaved: 0,
      totalCarbonSaved: 0,
      totalCarbonValue: 0,
      adoptedHouseholds: 0,
      avgEnergySavedPerHousehold: 0,
      avgCarbonSavedPerHousehold: 0
    });
  }, [projectionData]);

  return (
    <div className="w-full p-4">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Households</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <span className="font-semibold">{formatNumber(initialProjectionData[0]?.adoptedHouseholds || 0)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-green-600">{formatNumber(initialProjectionData[5]?.adoptedHouseholds || 0)}</span>
              </div>
            </div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={initialProjectionData}>
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

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Energy Saving Per Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">
                {formatNumber(initialProjectionData[2]?.avgEnergySavedPerHousehold || 0)} kWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">
                {formatNumber(initialProjectionData[5]?.avgEnergySavedPerHousehold || 0)} kWh
              </span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                initialProjectionData[5]?.avgEnergySavedPerHousehold,
                initialProjectionData[2]?.avgEnergySavedPerHousehold
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Total Energy Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">{formatNumber(initialProjectionData[2]?.totalEnergySaved || 0)} MWh</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">{formatNumber(initialProjectionData[5]?.totalEnergySaved || 0)} MWh</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                initialProjectionData[5]?.totalEnergySaved,
                initialProjectionData[2]?.totalEnergySaved
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Carbon Reduced Per Household</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">
                {formatNumber(initialProjectionData[2]?.avgCarbonSavedPerHousehold || 0)} tons
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">
                {formatNumber(initialProjectionData[5]?.avgCarbonSavedPerHousehold || 0)} tons
              </span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                initialProjectionData[5]?.avgCarbonSavedPerHousehold,
                initialProjectionData[2]?.avgCarbonSavedPerHousehold
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Total Carbon Savings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">{formatNumber(initialProjectionData[2]?.totalCarbonSaved || 0)} tons</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">{formatNumber(initialProjectionData[5]?.totalCarbonSaved || 0)} tons</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                initialProjectionData[5]?.totalCarbonSaved,
                initialProjectionData[2]?.totalCarbonSaved
              )}% growth
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Carbon Credit Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">2027:</span>
              <span className="font-semibold">${formatNumber(initialProjectionData[2]?.totalCarbonValue || 0)}M</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">2030:</span>
              <span className="font-semibold">${formatNumber(initialProjectionData[5]?.totalCarbonValue || 0)}M</span>
            </div>
            <div className="text-sm text-green-600">
              ↑ {calculateGrowthPercentage(
                initialProjectionData[5]?.totalCarbonValue,
                initialProjectionData[2]?.totalCarbonValue
              )}% growth
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Inputs */}
        <div className="w-full lg:w-1/3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Market Segments</CardTitle>
              <CardDescription>Enter customer base and adoption rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Single Products */}
              <div className="space-y-4">
                <h3 className="font-semibold">Single Product Segments</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* AC Only */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="acOnlyCustomers">AC Only Customers</Label>
                      <Input
                        id="acOnlyCustomers"
                        type="number"
                        value={marketData.acOnly.customers}
                        onChange={(e) => handleCustomerChange('acOnly', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acOnlyAdoption">Adoption Rate YoY (%): {marketData.acOnly.adoptionRate}%</Label>
                      <Slider
                        id="acOnlyAdoption"
                        value={[marketData.acOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acOnly', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acOnlyAIMode">AI Mode Usage (%): {marketData.acOnly.aiModeUsage}%</Label>
                      <Slider
                        id="acOnlyAIMode"
                        value={[marketData.acOnly.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('acOnly', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Fridge Only */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fridgeOnlyCustomers">Fridge Only Customers</Label>
                      <Input
                        id="fridgeOnlyCustomers"
                        type="number"
                        value={marketData.fridgeOnly.customers}
                        onChange={(e) => handleCustomerChange('fridgeOnly', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fridgeOnlyAdoption">Adoption Rate YoY (%): {marketData.fridgeOnly.adoptionRate}%</Label>
                      <Slider
                        id="fridgeOnlyAdoption"
                        value={[marketData.fridgeOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('fridgeOnly', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fridgeOnlyAIMode">AI Mode Usage (%): {marketData.fridgeOnly.aiModeUsage}%</Label>
                      <Slider
                        id="fridgeOnlyAIMode"
                        value={[marketData.fridgeOnly.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('fridgeOnly', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Washer Only */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="washerOnlyCustomers">Washer Only Customers</Label>
                      <Input
                        id="washerOnlyCustomers"
                        type="number"
                        value={marketData.washerOnly.customers}
                        onChange={(e) => handleCustomerChange('washerOnly', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="washerOnlyAdoption">Adoption Rate YoY (%): {marketData.washerOnly.adoptionRate}%</Label>
                      <Slider
                        id="washerOnlyAdoption"
                        value={[marketData.washerOnly.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('washerOnly', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="washerOnlyAIMode">AI Mode Usage (%): {marketData.washerOnly.aiModeUsage}%</Label>
                      <Slider
                        id="washerOnlyAIMode"
                        value={[marketData.washerOnly.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('washerOnly', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Product Combinations */}
              <div className="space-y-4">
                <h3 className="font-semibold">Two Product Combinations</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* AC + Fridge */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="acFridgeCustomers">AC + Fridge Customers</Label>
                      <Input
                        id="acFridgeCustomers"
                        type="number"
                        value={marketData.acFridge.customers}
                        onChange={(e) => handleCustomerChange('acFridge', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acFridgeAdoption">Adoption Rate YoY (%): {marketData.acFridge.adoptionRate}%</Label>
                      <Slider
                        id="acFridgeAdoption"
                        value={[marketData.acFridge.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acFridge', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acFridgeAIMode">AI Mode Usage (%): {marketData.acFridge.aiModeUsage}%</Label>
                      <Slider
                        id="acFridgeAIMode"
                        value={[marketData.acFridge.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('acFridge', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* AC + Washer */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="acWasherCustomers">AC + Washer Customers</Label>
                      <Input
                        id="acWasherCustomers"
                        type="number"
                        value={marketData.acWasher.customers}
                        onChange={(e) => handleCustomerChange('acWasher', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acWasherAdoption">Adoption Rate YoY (%): {marketData.acWasher.adoptionRate}%</Label>
                      <Slider
                        id="acWasherAdoption"
                        value={[marketData.acWasher.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('acWasher', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="acWasherAIMode">AI Mode Usage (%): {marketData.acWasher.aiModeUsage}%</Label>
                      <Slider
                        id="acWasherAIMode"
                        value={[marketData.acWasher.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('acWasher', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Fridge + Washer */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fridgeWasherCustomers">Fridge + Washer Customers</Label>
                      <Input
                        id="fridgeWasherCustomers"
                        type="number"
                        value={marketData.fridgeWasher.customers}
                        onChange={(e) => handleCustomerChange('fridgeWasher', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fridgeWasherAdoption">Adoption Rate YoY (%): {marketData.fridgeWasher.adoptionRate}%</Label>
                      <Slider
                        id="fridgeWasherAdoption"
                        value={[marketData.fridgeWasher.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('fridgeWasher', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fridgeWasherAIMode">AI Mode Usage (%): {marketData.fridgeWasher.aiModeUsage}%</Label>
                      <Slider
                        id="fridgeWasherAIMode"
                        value={[marketData.fridgeWasher.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('fridgeWasher', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* All Products */}
              <div className="space-y-4">
                <h3 className="font-semibold">All Products</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="allProductsCustomers">Customers with All Products</Label>
                      <Input
                        id="allProductsCustomers"
                        type="number"
                        value={marketData.allProducts.customers}
                        onChange={(e) => handleCustomerChange('allProducts', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="allProductsAdoption">Adoption Rate YoY (%): {marketData.allProducts.adoptionRate}%</Label>
                      <Slider
                        id="allProductsAdoption"
                        value={[marketData.allProducts.adoptionRate]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAdoptionChange('allProducts', value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="allProductsAIMode">AI Mode Usage (%): {marketData.allProducts.aiModeUsage}%</Label>
                      <Slider
                        id="allProductsAIMode"
                        value={[marketData.allProducts.aiModeUsage]}
                        max={100}
                        step={1}
                        onValueChange={(value) => handleAIModeChange('allProducts', value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Charts */}
        <div className="w-full lg:w-2/3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Projection Charts */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cumulative Carbon Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={initialProjectionData}>
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

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Cumulative Energy Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={initialProjectionData}>
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

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Carbon Credit Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={initialProjectionData}>
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

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Households Adopted</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={initialProjectionData}>
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
              BNEF then projects the bloc&apos;s prices will head towards €149 per ton in 2030.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SamsungPotential;