import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeafyGreen, ShoppingCart, Calculator, Lightbulb, Infinity, Zap } from "lucide-react";

const features = [
  {
    title: "Carbon Credits",
    description: "TASK FORCE:Calculate and track your carbon credit potential with SmartThings",
    path: "/carbon-credits",
    icon: LeafyGreen,
    image: "/carbon-credits.jpg"
  },
  {
    title: "AI Shopping Assistant",
    description: "JUST AN IDEA: Get personalized recommendations for energy-efficient appliances. Should be an add-on to Rubicon service.",
    path: "/shop",
    icon: ShoppingCart,
    image: "/shop.jpg"
  },
  {
    title: "Comfort Digital Twin Evaluator",
    description: "INCOMPLETE: Simulate AC and fan comfort settings",
    path: "/evaluator",
    icon: Calculator,
    image: "/evaluator.jpg"
  },
  {
    title: "DR Demo",
    description: "Not ready. Just some placeholder outline is here. ",
    path: "/dr-demo",
    icon: Zap,
    image: "/dr-demo.jpg"
  },
  {
    title: "ElectricityMaps Alternative",
    description: "In-house aletrnative for tracking carbon intensity of electricity worldwide (Moving to a new page)",
    path: "/em-alternative",
    icon: Lightbulb,
    image: "/em-alternative.jpg"
  }
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Link href={feature.path} key={feature.path}>
            <Card className="h-full hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle>{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4 rounded-md overflow-hidden bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="h-12 w-12 text-muted-foreground/20" />
                  </div>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
} 