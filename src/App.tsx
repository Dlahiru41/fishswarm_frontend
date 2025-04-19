// import React from 'react';
import FishBehaviorPrediction from './components/FishBehaviorPrediction';


function App() {
  // Example Firebase image URL
  const imageUrl = "https://firebasestorage.googleapis.com/v0/b/fish-detection-86201/o/images%2Fcurrent_image.jpg?alt=media&token=bcca80a9-f12c-4640-b331-a883bb5c91ef";

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