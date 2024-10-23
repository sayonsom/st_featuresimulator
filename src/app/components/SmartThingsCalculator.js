'use client'

// SmartThingsCalculator.js
'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SmartThingsCalculator = () => {
  const [billAmount, setBillAmount] = useState('');
  const [applianceUsage, setApplianceUsage] = useState({
    fridge: { kwh: 90, smartSavings: 0.20, isSmartEnabled: false },
    ac: { kwh: 300, smartSavings: 0.15, isSmartEnabled: false },
    washingMachine: { kwh: 30, smartSavings: 0.18, isSmartEnabled: false }
  });
  const [result, setResult] = useState(null);

  const FIXED_CHARGE = 50;

  const slabs = [
    { limit: 100, rate: 3 },
    { limit: 300, rate: 4.50 },
    { limit: 500, rate: 6 },
    { limit: Infinity, rate: 7.50 }
  ];

  const calculateUsage = (totalBill) => {
    let totalKwh = 0;
    let remainingBill = totalBill - FIXED_CHARGE;
    const slabUsage = [];

    for (let i = 0; i < slabs.length; i++) {
      const { limit, rate } = slabs[i];
      if (remainingBill <= 0) break;

      const prevLimit = i > 0 ? slabs[i-1].limit : 0;
      const maxPossibleKwh = i < slabs.length - 1 ? limit - prevLimit : remainingBill / rate;
      const costForSlab = Math.min(maxPossibleKwh * rate, remainingBill);
      let kwhInSlab = costForSlab / rate;

      slabUsage.push({ kwh: kwhInSlab, cost: costForSlab, rate });
      totalKwh += kwhInSlab;
      remainingBill -= costForSlab;
    }

    return { totalKwh, slabUsage };
  };

  const applySmartApplianceEfficiency = (totalKwh) => {
    let smartKwh = totalKwh;
    let totalSavings = 0;

    Object.entries(applianceUsage).forEach(([appliance, details]) => {
      if (details.isSmartEnabled) {
        const savings = details.kwh * details.smartSavings;
        totalSavings += savings;
      }
    });

    return smartKwh - totalSavings;
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
    if (kwh <= 100) return 1;
    if (kwh <= 300) return 2;
    if (kwh <= 500) return 3;
    return 4;
  };

  const handleCalculate = () => {
    const bill = parseFloat(billAmount);
    if (isNaN(bill) || bill <= FIXED_CHARGE) {
      alert('Please enter a valid bill amount greater than the fixed charge');
      return;
    }

    const { totalKwh } = calculateUsage(bill);
    const smartTotalKwh = applySmartApplianceEfficiency(totalKwh);

    const regularSlabCosts = calculateSlabwiseCosts(totalKwh);
    const smartSlabCosts = calculateSlabwiseCosts(smartTotalKwh);

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
      billWithoutFixed: bill - FIXED_CHARGE,
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold text-center mb-6">
        SmartThings - Proposed Tariff Rate Integration Features
      </h1>
      
      <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-2">
            Extract data from Bharat Bill Pay API with customer consent (₹)
        </div>
        <div className="flex space-x-2">
        
          <input
            type="number"
            value={billAmount}
            onChange={(e) => setBillAmount(e.target.value)}
            placeholder="Enter total bill amount (₹)"
            className="flex-grow px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCalculate}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Calculate
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Appliance Usage</h3>
          {Object.entries(applianceUsage).map(([appliance, details]) => (
            <div key={appliance} className="flex items-center space-x-4">
              <label className="w-32 text-sm font-medium capitalize">{appliance}:</label>
              <input
                type="number"
                value={details.kwh}
                onChange={(e) => handleApplianceChange(appliance, 'kwh', e.target.value)}
                className="w-24 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="kWh"
              />
              <span className="text-sm text-gray-500">kWh</span>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={details.isSmartEnabled}
                  onChange={(e) => handleApplianceChange(appliance, 'isSmartEnabled', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Samsung AI Energy Savings Mode</span>
              </label>
            </div>
          ))}
        </div>

        {result && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Bill Breakdown:</h3>
              <p>Fixed Charges: ₹{FIXED_CHARGE.toFixed(2)}</p>
              <p>Energy Charges: ₹{result.billWithoutFixed.toFixed(2)}</p>
              <p className="font-bold">Total Bill: ₹{(result.billWithoutFixed + FIXED_CHARGE).toFixed(2)}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Usage Comparison:</h3>
              <p>Regular Usage: {result.regularUsage.toFixed(2)} kWh</p>
              <p>Smart Usage: {result.smartUsage.toFixed(2)} kWh</p>
              <p className="font-bold">Total Savings: {result.savings.toFixed(2)} kWh</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Slab-wise Cost Comparison:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-2 border">Slab</th>
                            <th className="px-4 py-2 border">Unit Cost (₹)</th>
                            <th className="px-4 py-2 border">Regular Usage (kWh)</th>
                            <th className="px-4 py-2 border">Regular Cost (₹)</th>
                            <th className="px-4 py-2 border">Smart Usage (kWh)</th>
                            <th className="px-4 py-2 border">Smart Cost (₹)</th>
                            <th className="px-4 py-2 border">Savings (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.regularSlabCosts.map((regular, index) => {
                            const smart = result.smartSlabCosts[index] || { kwh: 0, cost: 0 };
                            return (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-4 py-2 border text-center">{regular.slab}</td>
                                <td className="px-4 py-2 border text-center">{slabs[index].rate.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-right">{regular.kwh.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-right">{regular.cost.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-right">{smart.kwh.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-right">{smart.cost.toFixed(2)}</td>
                                <td className="px-4 py-2 border text-right">{(regular.cost - smart.cost).toFixed(2)}</td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
              </div>
            </div>

            <div className="h-80 w-full">
              <h3 className="font-semibold mb-2">Daily Usage Comparison:</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.dailyUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="regularUsage" stroke="#8884d8" name="Regular Usage" />
                  <Line type="monotone" dataKey="smartUsage" stroke="#82ca9d" name="Smart Usage" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="h-80 w-full">
              <h3 className="font-semibold mb-2">Slab Transitions Over Time:</h3>
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
                    domain={[1, 4]} 
                    ticks={[1, 2, 3, 4]} 
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

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Slab Definitions:</h3>
              <div className="space-y-1">
                <p>Slab 1: 0-100 kWh (₹3.00/unit)</p>
                <p>Slab 2: 101-300 kWh (₹4.50/unit)</p>
                <p>Slab 3: 301-500 kWh (₹6.00/unit)</p>
                <p>Slab 4: Above 500 kWh (₹7.50/unit)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartThingsCalculator;