'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    setIsLoading(true);
    
    try {
      const success = await login(password);
      if (!success) {
        setError('Incorrect password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="space-y-4 w-full max-w-md">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700 text-sm">
            Please view this page on a Desktop
          </p>
        </div>
        <div className="p-6 bg-white rounded shadow-md">
          <h2 className="text-2xl mb-4 text-center">ST Ideas</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="border p-2 mb-4 w-full rounded"
              autoFocus
              disabled={isLoading}
            />
            {error && (
              <p className="text-red-500 mb-4 text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 