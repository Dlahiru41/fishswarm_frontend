// import React from 'react';
import FishBehaviorPrediction from './components/FishBehaviorPrediction';

function App() {
  // Example Firebase image URL
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/fish-detection-86201/o/images%2F03665.jpg?alt=media&token=bf7605af-ac3b-4e7c-8f09-0c11c6985619";

  return (
      <div className="App">
        <FishBehaviorPrediction
            imageUrl={imageUrl}
            filename="fish_image.jpg"
            apiEndpoint="http://127.0.0.1:5000/predict-from-url"
        />
      </div>
  );
}

export default App;