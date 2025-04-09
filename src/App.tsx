import React from 'react';
import FishBehaviorPrediction from './components/FishBehaviorPrediction';

function App() {
  // Example Firebase image URL
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/fish-detection-86201/o/images%2F00135.jpg?alt=media&token=cae4f1be-d715-421d-bc27-e04d6c1ec66b";

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