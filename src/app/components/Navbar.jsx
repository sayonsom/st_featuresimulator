'use client';

import Link from "next/link"
import { useAuth } from '../context/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, LogOut, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

const Navbar = () => {
  const { logout } = useAuth();

  return (
    <nav className="w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          SRI-B ST Energy
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                Experiments and Ideas
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/carbon-credits">ST TF (Carbon Credits)</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/evaluator">AC-Fan Comfort Simulator</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/bills">New Bill Calculator</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/shop">AI Appliance Shopping Assistance</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={logout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 