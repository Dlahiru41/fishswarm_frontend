import React, { useState, useEffect } from 'react';

// Interface for historical prediction data
interface HistoricalPrediction {
  timestamp: string;
  filename: string;
  pattern: string;
  confidence: number;
  imageUrl: string;
}

// Extended props interface to include API endpoint and history endpoint
interface FishPredictionProps {
  imageUrl: string;        // Firebase image URL
  filename: string;        // Image filename
  apiEndpoint?: string;    // Optional API endpoint for prediction
  historyEndpoint?: string; // Optional API endpoint for historical data
  initialPattern?: string; // Optional initial pattern (if already known)
  initialConfidence?: number; // Optional initial confidence (if already known)
}

const FishBehaviorPrediction: React.FC<FishPredictionProps> = ({
                                                                 imageUrl,
                                                                 filename,
                                                                 apiEndpoint = 'http://127.0.0.1:5000/predict-from-url',
                                                                 historyEndpoint = 'http://127.0.0.1:5000/prediction-history',
                                                                 initialPattern,
                                                                 initialConfidence
                                                               }) => {
  // State for prediction results
  const [pattern, setPattern] = useState<string>(initialPattern || 'Loading...');
  const [confidence, setConfidence] = useState<number>(initialConfidence || 0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPattern);
  const [error, setError] = useState<string | null>(null);

  // Sample historical data for development/testing
  const sampleHistoricalData: HistoricalPrediction[] = [
    {
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
      filename: 'goldfish_1.jpg',
      pattern: 'Swimming Straight',
      confidence: 92,
      imageUrl: 'https://firebasestorage.example.com/fish/zebrafish_sample1.jpg'
    },
    {
      timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
      filename: 'goldfish_2.jpg',
      pattern: 'Turning',
      confidence: 87,
      imageUrl: 'https://firebasestorage.example.com/fish/goldfish_turning_behavior.jpg'
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
      filename: 'goldfish_3.jpg',
      pattern: 'Clustering',
      confidence: 95,
      imageUrl: 'https://firebasestorage.example.com/fish/tetra_school_feeding.jpg'
    },
    {
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
      filename: 'goldfish_4.jpg',
      pattern: 'Swimming Straight',
      confidence: 78,
      imageUrl: 'https://firebasestorage.example.com/fish/betta_exploration.jpg'
    },
    {
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      filename: 'goldfish_5.jpg',
      pattern: 'Turning',
      confidence: 89,
      imageUrl: 'https://firebasestorage.example.com/fish/guppy_mating_display.jpg'
    }
  ];

  // State for historical data
  const [historicalData, setHistoricalData] = useState<HistoricalPrediction[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Flag to use sample data instead of API (for development)
  const [useSampleData, setUseSampleData] = useState<boolean>(true);

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
          3: 'Clustering',
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

  // Fetch historical prediction data
  const fetchHistoricalData = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);

    // For development, use sample data instead of API
    if (useSampleData) {
      // Simulate network delay
      setTimeout(() => {
        setHistoricalData(sampleHistoricalData);
        setIsHistoryLoading(false);
      }, 800);
      return;
    }

    // Real API call for production
    try {
      const response = await fetch(historyEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`History API error: ${response.status}`);
      }

      const data = await response.json();
      setHistoricalData(data);
    } catch (err) {
      setHistoryError(`Failed to load historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Toggle history view and load data if needed
  const toggleHistoryView = () => {
    if (!showHistory && historicalData.length === 0) {
      fetchHistoricalData();
    }
    setShowHistory(!showHistory);
  };

  // Visual styling based on pattern type
  const getPatternStyles = (patternType: string) => {
    switch(patternType) {
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
      case 'Clustering':
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

  const styles = getPatternStyles(pattern);

  // Get behavior description based on pattern
  const getBehaviorDescription = (patternType: string) => {
    switch(patternType) {
      case 'Swimming Straight':
        return "Fish swimming in a straight line with regular tail movements and stable orientation.";
      case 'Turning':
        return "Fish changing direction with asymmetrical body curvature and angled orientation.";
      case 'Clustering':
        return "Fish exhibiting typical feeding behavior with vertical orientation and mouth movements.";
      case 'Loading...':
        return "Analyzing fish behavior pattern...";
      case 'Error':
        return "Unable to analyze fish behavior. Please try again.";
      default:
        return "Unrecognized fish behavior pattern.";
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden border mb-4">
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
            <div className={`p-3 rounded-md ${styles.bgColor} ${styles.textColor} mb-4`}>
              <div className="font-medium mb-1">Behavior Description:</div>
              <p className="text-sm">{getBehaviorDescription(pattern)}</p>
            </div>

            {/* Error message if any */}
            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Toggle button for historical data */}
            <button
                onClick={toggleHistoryView}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {showHistory ? 'Hide Historical Data' : 'View Historical Data'}
            </button>
          </div>
        </div>

        {/* Historical data section */}
        {showHistory && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border">
              <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">Historical Predictions</h2>
                <div className="flex items-center">
                  {/* Sample data toggle for development */}
                  <div className="mr-3 flex items-center">
                    <span className="text-xs text-gray-500 mr-2">Sample Data</span>
                    <button
                        onClick={() => setUseSampleData(!useSampleData)}
                        className={`relative inline-flex h-5 w-10 items-center rounded-full ${useSampleData ? 'bg-blue-600' : 'bg-gray-200'}`}
                    >
                  <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${useSampleData ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                    </button>
                  </div>

                  <button
                      onClick={fetchHistoricalData}
                      className="p-1 rounded-full hover:bg-gray-200"
                      title="Refresh data"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4">
                {isHistoryLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : historyError ? (
                    <div className="p-3 bg-red-100 text-red-800 rounded-md">
                      <p className="text-sm">{historyError}</p>
                    </div>
                ) : historicalData.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No historical data available
                    </div>
                ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {historicalData.map((item, index) => {
                        const itemStyles = getPatternStyles(item.pattern);
                        return (
                            <div key={index} className="border rounded-lg overflow-hidden">
                              <div className={`${itemStyles.bgColor} ${itemStyles.textColor} px-4 py-2 border-b ${itemStyles.borderColor} flex justify-between items-center`}>
                                <div className="font-medium flex items-center">
                                  <span className="mr-2">{itemStyles.icon}</span>
                                  {item.pattern}
                                </div>
                                <div className="text-xs">{formatDate(item.timestamp)}</div>
                              </div>
                              <div className="p-3 grid grid-cols-12 gap-2">
                                <div className="col-span-4">
                                  {/* If using sample data, display placeholder instead of broken image links */}
                                  {useSampleData ? (
                                      <div className="w-full h-20 bg-gray-200 flex items-center justify-center rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                  ) : (
                                      <img
                                          src={item.imageUrl}
                                          alt={`Fish image: ${item.filename}`}
                                          className="w-full h-20 object-cover rounded"
                                      />
                                  )}
                                </div>
                                <div className="col-span-8">
                                  <div className="text-xs text-gray-500">Filename</div>
                                  <div className="text-sm font-medium mb-2 truncate">{item.filename}</div>

                                  <div className="text-xs text-gray-500">Confidence</div>
                                  <div className="flex items-center">
                                    <div className="flex-grow h-2 bg-gray-200 rounded-full mr-2">
                                      <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{ width: `${item.confidence}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs font-medium">{item.confidence}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
};

export default FishBehaviorPrediction;