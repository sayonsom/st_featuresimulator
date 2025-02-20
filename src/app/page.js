import FeatureCards from './components/FeatureCards';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SmartThings Energy - Some experiments
          </h1>
          <p className="text-xl text-gray-600">
            Just a playground for new ideas 
          </p>
        </div>
        <FeatureCards />
      </div>
    </main>
  );
}