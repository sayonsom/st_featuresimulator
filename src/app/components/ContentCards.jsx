import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ShoppingCart } from "lucide-react";

export const ApplianceCard = ({ appliance }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{appliance.name}</CardTitle>
        <CardDescription>{appliance.brand}</CardDescription>
      </CardHeader>
      <CardContent>
        <img
          src="/api/placeholder/400/200"
          alt={appliance.name}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
        <div className="space-y-2">
          <p className="text-2xl font-bold">${appliance.price}</p>
          <ul className="space-y-1">
            {appliance.features.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground">• {feature}</li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full gap-2">
          <ShoppingCart className="h-4 w-4" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export const VideoCard = ({ video }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{video.title}</CardTitle>
        <CardDescription>{video.channel}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <img
            src="/api/placeholder/400/200"
            alt={video.title}
            className="w-full h-48 object-cover rounded-md"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 p-4 rounded-full">
              <Play className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{video.description}</p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full gap-2">
          <Play className="h-4 w-4" />
          Watch Video
        </Button>
      </CardFooter>
    </Card>
  );
};