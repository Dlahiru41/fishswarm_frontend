// import React from 'react';
import FishBehaviorPrediction from './components/FishBehaviorPrediction';


function App() {
  // Example Firebase image URL
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/fish-detection-86201/o/images%2Fcurrent_image.jpg?alt=media&token=9b0f9223-34af-400d-8891-b4aca12ebce1";

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