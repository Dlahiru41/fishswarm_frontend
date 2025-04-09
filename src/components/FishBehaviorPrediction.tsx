import React, { useState, useEffect } from 'react';

// Extended props interface to include API endpoint
interface FishPredictionProps {
  imageUrl: string;        // Firebase image URL
  filename: string;        // Image filename
  apiEndpoint?: string;    // Optional API endpoint for prediction
  initialPattern?: string; // Optional initial pattern (if already known)
  initialConfidence?: number; // Optional initial confidence (if already known)
}

const FishBehaviorPrediction: React.FC<FishPredictionProps> = ({
                                                                 imageUrl,
                                                                 filename,
                                                                 apiEndpoint = 'http://127.0.0.1:5000/predict-from-url',
                                                                 initialPattern,
                                                                 initialConfidence
                                                               }) => {
  // State for prediction results
  const [pattern, setPattern] = useState<string>(initialPattern || 'Loading...');
  const [confidence, setConfidence] = useState<number>(initialConfidence || 0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPattern);
  const [error, setError] = useState<string | null>(null);

  // Run prediction when component mounts or imageUrl changes
  useEffect(() => {
    // Skip prediction if initial values were provided
    if (initialPattern && initialConfidence !== undefined) {
      return;
    }

    const runPrediction = async () => {
      if (!imageUrl) {
        setError('No image URL provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Instead of fetching the image ourselves, send the URL to the API
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: imageUrl,
            filename: filename
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        // Map numerical pattern to named pattern (adjust based on your model output)
        const patternMap: { [key: number]: string } = {
          1: 'Swimming Straight',
          2: 'Turning',
          3: 'Feeding',
          // Add more mappings as needed
        };

        // Update state with prediction results
        setPattern(patternMap[result.pattern] || `Pattern ${result.pattern}`);
        setConfidence(Math.round(result.confidence * 100)); // Convert to percentage
      } catch (err) {
        setError(`Prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setPattern('Error');
        setConfidence(0);
      } finally {
        setIsLoading(false);
      }
    };

    runPrediction();
  }, [imageUrl, filename, apiEndpoint, initialPattern, initialConfidence]);

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
      case 'Loading...':
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          icon: '⟳'
        };
      case 'Error':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          icon: '⚠️'
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
      case 'Loading...':
        return "Analyzing fish behavior pattern...";
      case 'Error':
        return "Unable to analyze fish behavior. Please try again.";
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
                      crossOrigin="anonymous" // Try adding this for images that might have CORS issues
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
                <span className="font-medium">{isLoading ? 'Analyzing...' : pattern}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-sm text-gray-500">Confidence</div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-4">
                <div
                    className={`${isLoading ? 'bg-gray-400 animate-pulse' : 'bg-blue-600'} h-4 rounded-full`}
                    style={{ width: `${confidence}%` }}
                ></div>
              </div>
              <div className="text-right mt-1 text-sm font-medium">
                {isLoading ? 'Calculating...' : `${confidence}%`}
              </div>
            </div>

            {/* Behavior description */}
            <div className={`p-3 rounded-md ${styles.bgColor} ${styles.textColor} mb-2`}>
              <div className="font-medium mb-1">Behavior Description:</div>
              <p className="text-sm">{getBehaviorDescription()}</p>
            </div>

            {/* Error message if any */}
            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default FishBehaviorPrediction;