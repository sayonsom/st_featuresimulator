'use client'

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SmartThingsCalculator = () => {
  const [billAmount, setBillAmount] = useState('');
  const [taxPercentage, setTaxPercentage] = useState(5); // Default 5% tax
  const [sanctionedLoad, setSanctionedLoad] = useState(5); // Default 5KW
  const [loadRate, setLoadRate] = useState(120); // Default 120 Rs/KW
  const [slabRates, setSlabRates] = useState({
    slab1: 4.5,  // 0-50
    slab2: 5.9,  // 50-100
    slab3: 6.25, // 100-300
    slab4: 7.0,  // 300-500
    slab5: 8.5   // 500+
  });
  
  const [applianceUsage, setApplianceUsage] = useState({
    fridge: { kwh: 90, smartSavings: 0.20, isSmartEnabled: false },
    ac: { kwh: 300, smartSavings: 0.15, isSmartEnabled: false },
    washingMachine: { kwh: 30, smartSavings: 0.18, isSmartEnabled: false }
  });
  const [result, setResult] = useState(null);

  const getFixedCharge = () => sanctionedLoad * loadRate;

  const slabs = [
    { limit: 50, rate: slabRates.slab1 },
    { limit: 100, rate: slabRates.slab2 },
    { limit: 300, rate: slabRates.slab3 },
    { limit: 500, rate: slabRates.slab4 },
    { limit: Infinity, rate: slabRates.slab5 }
  ];

  const calculateUsage = (totalBill) => {
    const fixedCharge = getFixedCharge();
    
    // First, subtract fixed charge from total bill
    const billWithoutFixed = totalBill - fixedCharge;
    
    // Calculate tax only on the energy charges portion
    const energyChargesWithoutTax = billWithoutFixed / (1 + (taxPercentage / 100));
    const taxOnEnergyCharges = billWithoutFixed - energyChargesWithoutTax;
    
    let remainingBill = energyChargesWithoutTax;
    let totalKwh = 0;
    const slabUsage = [];

    for (let i = 0; i < slabs.length; i++) {
        const { limit, rate } = slabs[i];
        if (remainingBill <= 0) break;

        const prevLimit = i > 0 ? slabs[i-1].limit : 0;
        const maxPossibleKwh = limit - prevLimit;
        const costForSlab = Math.min(maxPossibleKwh * rate, remainingBill);
        let kwhInSlab = costForSlab / rate;

        slabUsage.push({ kwh: kwhInSlab, cost: costForSlab, rate });
        totalKwh += kwhInSlab;
        remainingBill -= costForSlab;
    }

    return {
        totalKwh,
        slabUsage,
        fixedCharge,
        energyChargesWithoutTax,
        taxOnEnergyCharges,
        totalBillBreakdown: {
            energyCharges: energyChargesWithoutTax,
            fixedCharge: fixedCharge,
            tax: taxOnEnergyCharges,
            total: energyChargesWithoutTax + fixedCharge + taxOnEnergyCharges
        }
    };
};

  const applySmartApplianceEfficiency = (totalKwh) => {
    let totalSavings = 0;

    Object.entries(applianceUsage).forEach(([appliance, details]) => {
      if (details.isSmartEnabled) {
        const savings = details.kwh * details.smartSavings;
        totalSavings += savings;
      }
    });

    return totalKwh - totalSavings;
  };

  const calculateSlabwiseCosts = (totalKwh) => {
    let remainingKwh = totalKwh;
    const slabCosts = [];

    for (let i = 0; i < slabs.length; i++) {
      const { limit, rate } = slabs[i];
      const prevLimit = i > 0 ? slabs[i-1].limit : 0;
      const kwhInSlab = Math.min(remainingKwh, limit - prevLimit);
      const cost = kwhInSlab * rate;

      slabCosts.push({ slab: i + 1, kwh: kwhInSlab, cost });
      remainingKwh -= kwhInSlab;

      if (remainingKwh <= 0) break;
    }

    return slabCosts;
  };

  const generateDailyUsageData = (regularKwh, smartKwh) => {
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      return {
        day,
        regularUsage: (regularKwh / 30) * day,
        smartUsage: (smartKwh / 30) * day,
      };
    });
  };

  const generateSlabData = (regularKwh, smartKwh) => {
    const daysInMonth = 30;
    const regularDaily = regularKwh / daysInMonth;
    const smartDaily = smartKwh / daysInMonth;
    
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = new Date(2024, 0, day);
      const regularCumulative = regularDaily * day;
      const smartCumulative = smartDaily * day;
      
      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        regularSlab: getSlabNumber(regularCumulative),
        smartSlab: getSlabNumber(smartCumulative),
      };
    });
  };

  const getSlabNumber = (kwh) => {
    if (kwh <= 50) return 1;
    if (kwh <= 100) return 2;
    if (kwh <= 300) return 3;
    if (kwh <= 500) return 4;
    return 5;
  };

  const handleCalculate = () => {
    const bill = parseFloat(billAmount);
    if (isNaN(bill) || bill <= getFixedCharge()) {
        alert('Please enter a valid bill amount greater than the fixed charge');
        return;
    }

    const {
        totalKwh,
        slabUsage,
        totalBillBreakdown,
        energyChargesWithoutTax,
        taxOnEnergyCharges
    } = calculateUsage(bill);

    const smartTotalKwh = applySmartApplianceEfficiency(totalKwh);

    const regularSlabCosts = calculateSlabwiseCosts(totalKwh);
    const smartSlabCosts = calculateSlabwiseCosts(smartTotalKwh);

    // Calculate smart savings with tax implications
    const regularTotalCost = regularSlabCosts.reduce((sum, slab) => sum + slab.cost, 0);
    const smartTotalCost = smartSlabCosts.reduce((sum, slab) => sum + slab.cost, 0);
    const costSavings = regularTotalCost - smartTotalCost;
    const taxSavings = costSavings * (taxPercentage / 100);

    const dailyUsageData = generateDailyUsageData(totalKwh, smartTotalKwh);
    const slabTransitionData = generateSlabData(totalKwh, smartTotalKwh);

    setResult({
        regularUsage: totalKwh,
        smartUsage: smartTotalKwh,
        regularSlabCosts,
        smartSlabCosts,
        dailyUsageData,
        slabTransitionData,
        savings: totalKwh - smartTotalKwh,
        billBreakdown: totalBillBreakdown,
        costSavings: costSavings,
        taxSavings: taxSavings,
        totalSavings: costSavings + taxSavings
    });
};
  const handleApplianceChange = (appliance, field, value) => {
    setApplianceUsage(prev => ({
      ...prev,
      [appliance]: {
        ...prev[appliance],
        [field]: field === 'kwh' ? parseFloat(value) || 0 : value
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 dark:bg-gray-900 text-gray-100 rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-100">
        SmartThings - Energy Savings Calculator
      </h1>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Bill Amount (₹)
            </label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="Enter total bill amount"
              className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100 placeholder-gray-400"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Tax Percentage (%)
            </label>
            <input
              type="number"
              value={taxPercentage}
              onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Sanctioned Load (KW)
            </label>
            <input
              type="number"
              value={sanctionedLoad}
              onChange={(e) => setSanctionedLoad(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200">
              Load Rate (₹/KW)
            </label>
            <input
              type="number"
              value={loadRate}
              onChange={(e) => setLoadRate(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Slab Rates (₹/unit)</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(slabRates).map(([slab, rate], index) => (
              <div key={slab} className="space-y-1">
                <label className="block text-sm font-medium text-gray-200">
                  Slab {index + 1}
                </label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setSlabRates(prev => ({
                    ...prev,
                    [slab]: parseFloat(e.target.value) || 0
                  }))}
                  className="w-full px-2 py-1 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Appliance Usage</h3>
          {Object.entries(applianceUsage).map(([appliance, details]) => (
            <div key={appliance} className="flex items-center space-x-4">
              <label className="w-32 text-sm font-medium capitalize text-gray-200">{appliance}:</label>
              <input
                type="number"
                value={details.kwh}
                onChange={(e) => handleApplianceChange(appliance, 'kwh', e.target.value)}
                className="w-24 px-2 py-1 bg-gray-700 dark:bg-gray-800 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-100"
                placeholder="kWh"
              />
              <span className="text-sm text-gray-400">kWh</span>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={details.isSmartEnabled}
                  onChange={(e) => handleApplianceChange(appliance, 'isSmartEnabled', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">Samsung AI Energy Savings Mode</span>
              </label>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleCalculate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Calculate
          </button>
        </div>

        {result && (
    <div className="space-y-6">
        {/* New Summary Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total kWh Card */}
            <div className="bg-gray-700 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-600">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="rounded-full p-3 bg-blue-900 dark:bg-blue-800">
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-6 w-6 text-blue-200" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M13 10V3L4 14h7v7l9-11h-7z" 
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-300">Total Energy Consumption</h2>
                                <div className="flex items-baseline">
                                    <p className="text-2xl font-semibold text-gray-100">
                                        {result.regularUsage.toFixed(1)}
                                    </p>
                                    <p className="ml-1 text-sm font-medium text-gray-400">kWh</p>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Calculated from your bill amount
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Energy Savings Card */}
            <div className="bg-gray-700 dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-600">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="rounded-full p-3 bg-green-50">
                                <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className="h-6 w-6 text-green-500" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                >
                                    <path 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round" 
                                        strokeWidth={2} 
                                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h2 className="text-sm font-medium text-gray-300">Smart Energy Savings</h2>
                                <div className="flex items-baseline space-x-4">
                                    <div>
                                        <p className="text-2xl font-semibold text-gray-100">
                                            {result.savings.toFixed(1)}
                                        </p>
                                        <p className="text-sm font-medium text-gray-400">kWh Saved</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-semibold text-green-600">
                                            ₹{result.totalSavings.toFixed(1)}
                                        </p>
                                        <p className="text-sm font-medium text-gray-400">Money Saved</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {((result.savings / result.regularUsage) * 100).toFixed(1)}% reduction in consumption
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-200">Detailed Bill Breakdown:</h3>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Fixed Charges:</span>
                    <span className="text-right">₹{result.billBreakdown.fixedCharge.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Energy Charges (Before Tax):</span>
                    <span className="text-right">₹{result.billBreakdown.energyCharges.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Tax ({taxPercentage}% on Energy Charges):</span>
                    <span className="text-right">₹{result.billBreakdown.tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 grid grid-cols-2 gap-2 font-bold">
                    <span>Total Bill:</span>
                    <span className="text-right">₹{result.billBreakdown.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-200">Smart Device Savings:</h3>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Energy Usage Savings:</span>
                    <span className="text-right">{result.savings.toFixed(2)} kWh</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Cost Savings (Before Tax):</span>
                    <span className="text-right">₹{result.costSavings.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="text-gray-600">Tax Savings:</span>
                    <span className="text-right">₹{result.taxSavings.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 grid grid-cols-2 gap-2 font-bold">
                    <span>Total Money Saved:</span>
                    <span className="text-right">₹{result.totalSavings.toFixed(2)}</span>
                </div>
            </div>
        </div>

            <div>
              <h3 className="font-semibold mb-2 text-gray-200">Slab-wise Cost Comparison:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-700 dark:bg-gray-800 border border-gray-600">
                  <thead>
                    <tr className="bg-gray-600 dark:bg-gray-700">
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Slab</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Unit Cost (₹)</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Regular Usage (kWh)</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Regular Cost (₹)</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Smart Usage (kWh)</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Smart Cost (₹)</th>
                      <th className="px-4 py-2 border border-gray-600 text-gray-200">Savings (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                  {result.regularSlabCosts.map((regular, index) => {
                      const smart = result.smartSlabCosts[index] || { kwh: 0, cost: 0 };
                      return (
                        <tr key={index} className="hover:bg-gray-600 dark:hover:bg-gray-700">
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-center">{regular.slab}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-center">{slabs[index].rate.toFixed(2)}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-right">{regular.kwh.toFixed(2)}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-right">{regular.cost.toFixed(2)}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-right">{smart.kwh.toFixed(2)}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-right">{smart.cost.toFixed(2)}</td>
                          <td className="px-4 py-2 border border-gray-600 text-gray-200 text-right">{(regular.cost - smart.cost).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="h-80 w-full">
              <h3 className="font-semibold mb-2 text-gray-200">Daily Usage Comparison:</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.dailyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      color: '#E5E7EB'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="regularUsage" stroke="#60A5FA" name="Regular Usage" />
                  <Line type="monotone" dataKey="smartUsage" stroke="#34D399" name="Smart Usage" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80 w-full">
              <h3 className="font-semibold mb-2 text-gray-200">Slab Transitions Over Time:</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.slabTransitionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    interval={2} 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    label={{ 
                      value: 'Slab', 
                      angle: -90, 
                      position: 'insideLeft' 
                    }}
                  />
                  <Tooltip 
                    formatter={(value) => `Slab ${value}`}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="stepAfter" 
                    dataKey="regularSlab" 
                    stroke="#8884d8" 
                    name="Regular Usage Slab"
                    strokeWidth={2}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="smartSlab" 
                    stroke="#82ca9d" 
                    name="Smart Usage Slab"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-700 dark:bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h3 className="font-semibold mb-2 text-gray-200">Slab Definitions:</h3>
              <div className="space-y-1 text-gray-300">
                <p>Slab 1: 0-50 kWh (₹{slabRates.slab1}/unit)</p>
                <p>Slab 2: 51-100 kWh (₹{slabRates.slab2}/unit)</p>
                <p>Slab 3: 101-300 kWh (₹{slabRates.slab3}/unit)</p>
                <p>Slab 4: 301-500 kWh (₹{slabRates.slab4}/unit)</p>
                <p>Slab 5: Above 500 kWh (₹{slabRates.slab5}/unit)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartThingsCalculator;