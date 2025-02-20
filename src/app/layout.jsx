import "./globals.css"
import { AuthProvider } from './context/AuthContext'
import Navbar from "./components/Navbar"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
} 