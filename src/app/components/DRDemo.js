'use client';

import React, { useState, useEffect } from 'react';
import { Building, BatteryCharging, Home, DollarSign, AlertTriangle, Smartphone, Zap, ThermometerSun } from 'lucide-react';

const DRDemo = () => {
  // Track multiple scenarios and their states
  const [scenarios, setScenarios] = useState([
    {
      id: 1,
      peakDemand: 12000,
      reduction: 2000,
      temperature: 95,
      utilityBenefit: 0,
      userSavings: 0,
      responseTime: 5,
      active: true
    },
    {
      id: 2,
      peakDemand: 15000,
      reduction: 3000,
      temperature: 98,
      utilityBenefit: 0,
      userSavings: 0,
      responseTime: 3,
      active: false
    }
  ]);

  const [step, setStep] = useState(0);
  const [currentScenario, setCurrentScenario] = useState(0);
  const [showSignal, setShowSignal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  // Track appliance states
  const [appliances, setAppliances] = useState({
    ac: { running: true, power: 3000 },
    waterHeater: { running: true, power: 2000 },
    dishwasher: { running: true, power: 1500 }
  });

  const steps = [
    { 
      title: "Normal Operation",
      utilityState: "Standard grid operation",
      consumerState: "Normal power consumption"
    },
    { 
      title: "Peak Detection",
      utilityState: "High demand alert",
      consumerState: "Peak usage period"
    },
    { 
      title: "Signal Generation",
      utilityState: "Initiating DR event",
      consumerState: "Receiving signals"
    },
    { 
      title: "User Notification",
      utilityState: "Event in progress",
      consumerState: "Processing DR signals"
    },
    { 
      title: "Demand Response",
      utilityState: "Monitoring response",
      consumerState: "Reducing consumption"
    },
    { 
      title: "Benefits Analysis",
      utilityState: "Calculating savings",
      consumerState: "Viewing benefits"
    }
  ];

  // Calculate benefits based on scenario and step
  useEffect(() => {
    if (step >= 4) {
      const scenario = scenarios[currentScenario];
      const newScenarios = [...scenarios];
      
      // Calculate progressive benefits
      newScenarios[currentScenario] = {
        ...scenario,
        utilityBenefit: Math.floor(scenario.reduction * 0.15 * (step === 5 ? 1.5 : 1)),
        userSavings: Math.floor(scenario.reduction * 0.08 * (step === 5 ? 1.2 : 1))
      };
      
      setScenarios(newScenarios);
    }
  }, [step, currentScenario, scenarios]);

  // Handle step transitions
  useEffect(() => {
    setShowSignal(step >= 2);
    setShowNotification(step >= 3);
    setShowResponse(step >= 4);

    // Update appliance states based on step
    if (step >= 4) {
      setAppliances(prev => ({
        ac: { ...prev.ac, power: prev.ac.power * 0.7 },
        waterHeater: { ...prev.waterHeater, running: false },
        dishwasher: { ...prev.dishwasher, running: false }
      }));
    } else {
      setAppliances({
        ac: { running: true, power: 3000 },
        waterHeater: { running: true, power: 2000 },
        dishwasher: { running: true, power: 1500 }
      });
    }
  }, [step]);

  // Switch between scenarios
  const toggleScenario = () => {
    setCurrentScenario(prev => (prev + 1) % scenarios.length);
  };

  return (
    <div className="p-8 bg-gray-50 rounded-lg shadow-lg">
      {/* Header with Scenario Toggle */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Demand Response Flow Visualization</h2>
        <button 
          onClick={toggleScenario}
          className="mb-4 px-4 py-2 bg-purple-500 text-white rounded"
        >
          Switch Scenario: {scenarios[currentScenario].temperature}°F Day
        </button>
        
        <div className="flex justify-center space-x-4 mb-4">
          {steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`px-4 py-2 rounded ${
                step === i ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Visualization */}
      <div className="flex justify-between items-center h-96 relative">
        {/* Utility Side */}
        <div className="w-1/3 text-center">
          <Building size={64} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Utility</h3>
          
          {/* Peak Demand Indicator */}
          <div className="bg-blue-100 p-4 rounded-lg mb-4">
            <ThermometerSun className="mx-auto mb-2" />
            <p>Peak Demand: {scenarios[currentScenario].peakDemand} kW</p>
            {step >= 1 && (
              <div className="mt-2 text-red-500">
                <AlertTriangle className="inline mr-1" size={16} />
                Critical Peak Alert
              </div>
            )}
          </div>

          {/* OpenADR Signal */}
          {step >= 2 && (
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="font-mono text-sm">
                OpenADR 2.0b
                <br />
                EiEvent: GRID_RELIABILITY
                <br />
                Priority: HIGH
                <br />
                Target: -{scenarios[currentScenario].reduction} kW
              </p>
            </div>
          )}

          {/* Utility Benefits */}
          {step >= 4 && (
            <div className="mt-4 bg-green-100 p-4 rounded-lg">
              <DollarSign className="mx-auto mb-2" />
              <p>Utility Benefit: ${scenarios[currentScenario].utilityBenefit}</p>
            </div>
          )}
        </div>

        {/* Communication Channel */}
        <div className="flex-1 relative">
          {showSignal && (
            <div className="absolute top-1/2 w-full flex justify-center">
              <div className="animate-pulse">
                <Zap className="text-yellow-500" size={32} />
              </div>
            </div>
          )}
        </div>

        {/* Consumer Side */}
        <div className="w-1/3 text-center">
          <Home size={64} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Consumer</h3>

          {/* Appliance Status */}
          <div className="bg-gray-100 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-2">Appliance Status</h4>
            <div className="space-y-2 text-sm">
              <div className={appliances.ac.running ? 'text-green-500' : 'text-red-500'}>
                AC: {appliances.ac.power}W
              </div>
              <div className={appliances.waterHeater.running ? 'text-green-500' : 'text-red-500'}>
                Water Heater: {appliances.waterHeater.running ? 'Active' : 'Paused'}
              </div>
              <div className={appliances.dishwasher.running ? 'text-green-500' : 'text-red-500'}>
                Dishwasher: {appliances.dishwasher.running ? 'Running' : 'Delayed'}
              </div>
            </div>
          </div>

          {/* Mobile Notification */}
          {showNotification && (
            <div className="relative w-32 h-64 bg-gray-200 rounded-3xl mx-auto p-4">
              <div className="absolute top-8 left-4 right-4">
                <div className="bg-red-500 text-white p-2 rounded-lg text-sm">
                  Peak Demand Alert!
                  <br />
                  Reduce usage for
                  <br />
                  ${scenarios[currentScenario].userSavings} savings
                </div>
              </div>
            </div>
          )}

          {/* Consumer Benefits */}
          {step >= 4 && (
            <div className="mt-4 bg-green-100 p-4 rounded-lg">
              <DollarSign className="mx-auto mb-2" />
              <p>Your Savings: ${scenarios[currentScenario].userSavings}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Description */}
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Utility Status:</h4>
            <p>{steps[step].utilityState}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Consumer Status:</h4>
            <p>{steps[step].consumerState}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DRDemo;