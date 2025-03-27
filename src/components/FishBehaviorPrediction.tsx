import React from 'react';

// Props interface for the component
interface FishPredictionProps {
  imageUrl: string;  // Firebase image URL
  filename: string;  // Image filename
  pattern: string;   // Predicted pattern
  confidence: number; // Prediction confidence
}

const FishBehaviorPrediction: React.FC<FishPredictionProps> = ({ 
  imageUrl, 
  filename, 
  pattern, 
  confidence 
}) => {
  // Visual styling based on pattern type
  const getPatternStyles = () => {
    switch(pattern) {
      case 'Swimming Straight':
        return { 
          bgColor: 'bg-blue-100', 
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: '→'
        };
      case 'Turning':
        return { 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          icon: '↺'
        };
      case 'Feeding':
        return { 
          bgColor: 'bg-amber-100', 
          textColor: 'text-amber-800',
          borderColor: 'border-amber-300',
          icon: '▼'
        };
      default:
        return { 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          icon: '?'
        };
    }
  };
  
  const styles = getPatternStyles();
  
  // Get behavior description based on pattern
  const getBehaviorDescription = () => {
    switch(pattern) {
      case 'Swimming Straight':
        return "Fish swimming in a straight line with regular tail movements and stable orientation.";
      case 'Turning':
        return "Fish changing direction with asymmetrical body curvature and angled orientation.";
      case 'Feeding':
        return "Fish exhibiting typical feeding behavior with vertical orientation and mouth movements.";
      default:
        return "Unrecognized fish behavior pattern.";
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border">
        <div className="p-4 bg-gray-50 border-b">
          <h1 className="text-xl font-bold text-gray-800">Fish Behavior Analysis</h1>
        </div>
        
        {/* Image from Firebase */}
        <div className="aspect-w-4 aspect-h-3 bg-gray-200">
          <div className="flex items-center justify-center p-2">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Fish image from Firebase" 
                className="max-h-48 object-contain"
              />
            ) : (
              <div className="text-gray-400">Image not available</div>
            )}
          </div>
        </div>
        
        {/* Prediction result */}
        <div className="p-6">
          <div className="mb-4">
            <div className="text-sm text-gray-500">Filename</div>
            <div className="font-medium">{filename}</div>
          </div>
          
          <div className="mb-4">
            <div className="text-sm text-gray-500">Detected Behavior</div>
            <div className={`mt-1 inline-flex items-center px-4 py-2 rounded-full border ${styles.bgColor} ${styles.textColor} ${styles.borderColor}`}>
              <span className="text-lg mr-2">{styles.icon}</span>
              <span className="font-medium">{pattern}</span>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-gray-500">Confidence</div>
            <div className="mt-1 w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full" 
                style={{ width: `${confidence}%` }}
              ></div>
            </div>
            <div className="text-right mt-1 text-sm font-medium">
              {confidence}%
            </div>
          </div>
          
          {/* Behavior description */}
          <div className={`p-3 rounded-md ${styles.bgColor} ${styles.textColor} mb-2`}>
            <div className="font-medium mb-1">Behavior Description:</div>
            <p className="text-sm">{getBehaviorDescription()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FishBehaviorPrediction;