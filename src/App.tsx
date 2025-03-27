import React from 'react';
import FishBehaviorPrediction from './components/FishBehaviorPrediction';

function App() {
  // Example data - in a real app, this would come from your backend/Firebase
  const predictionData = {
    imageUrl: "https://images.unsplash.com/photo-1524704796725-9fc3044a58b2?auto=format&fit=crop&w=800&q=80",
    filename: "tropical_fish_001.jpg",
    pattern: "Swimming Straight",
    confidence: 92
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <FishBehaviorPrediction {...predictionData} />
    </div>
  );
}

export default App;