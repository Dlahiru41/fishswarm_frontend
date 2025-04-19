import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPredictionHistory, PredictionRecord } from '../services/predictionService';

import { db } from '../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Extended props interface to include API endpoint and refresh interval
interface FishPredictionProps {
  imageUrl: string;        // Firebase image URL
  filename: string;        // Image filename
  apiEndpoint?: string;    // Optional API endpoint for prediction
  initialPattern?: string; // Optional initial pattern (if already known)
  initialConfidence?: number; // Optional initial confidence (if already known)
  refreshInterval?: number; // Optional refresh interval in milliseconds (default: 5 minutes)
}

const FishBehaviorPrediction: React.FC<FishPredictionProps> = ({
                                                                 imageUrl,
                                                                 filename,
                                                                 apiEndpoint = 'http://127.0.0.1:5000/predict-from-url',
                                                                 initialPattern,
                                                                 initialConfidence,
                                                                 refreshInterval = 5 * 60 * 1000 // Default: 5 minutes in milliseconds
                                                               }) => {
  // State for prediction results
  const [pattern, setPattern] = useState<string>(initialPattern || 'Loading...');
  // const [confidence, setConfidence] = useState<number>(initialConfidence || 0);
  const [isLoading, setIsLoading] = useState<boolean>(!initialPattern);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // State for refresh timer
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState<number>(refreshInterval);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // State for historical data
  const [historicalData, setHistoricalData] = useState<PredictionRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Flag to use sample data instead of Firebase (for development)
  const [useSampleData, setUseSampleData] = useState<boolean>(false);

  // Sample historical data for development/testing
  const sampleHistoricalData: PredictionRecord[] = [
    {
      timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
      filename: 'goldfish_1.jpg',
      pattern: 'Normal Swarm',
      confidence: 92,
      imageUrl: 'https://firebasestorage.example.com/fish/zebrafish_sample1.jpg'
    },
    {
      timestamp: new Date(Date.now() - 86400000 * 1), // 1 day ago
      filename: 'goldfish_2.jpg',
      pattern: 'Erratic Movement',
      confidence: 87,
      imageUrl: 'https://firebasestorage.example.com/fish/goldfish_turning_behavior.jpg'
    },
    // Other sample data...
  ];

  // This function directly saves to Firestore within the component
  const savePredictionToFirebase = async (
      patternValue: string,
      confidenceValue: number
  ) => {
    try {
      setSaveStatus("Saving prediction to Firestore...");
      console.log("Attempting to save prediction to Firestore");

      // Create prediction record
      const predictionData = {
        timestamp: Timestamp.fromDate(new Date()),
        filename: filename,
        pattern: patternValue,
        confidence: confidenceValue,
        imageUrl: imageUrl
      };

      console.log("Prediction data:", predictionData);

      // Directly add document to collection
      const docRef = await addDoc(collection(db, 'fishPredictions'), predictionData);

      console.log("Prediction saved to Firestore with ID:", docRef.id);
      setSaveStatus("Prediction saved successfully!");

      // If history is already shown, refresh the history data
      if (showHistory && !useSampleData) {
        fetchHistoricalData();
      }

      return docRef.id;
    } catch (err) {
      console.error("Failed to save prediction to Firebase:", err);
      setSaveStatus(`Error saving prediction: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  // Run prediction - extracted as a reusable function
  const runPrediction = useCallback(async () => {
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
        1: 'Normal Swarm',
        2: 'Erratic Movement',
        3: 'Clustering',
        // Add more mappings as needed
      };

      // Get pattern name
      const patternName = patternMap[result.pattern] || `Pattern ${result.pattern}`;

      // Get confidence percentage
      const confidencePercentage = Math.round(result.confidence * 100);

      // Update state with prediction results
      setPattern(patternName);
      // setConfidence(confidencePercentage);

      // Update last refresh time
      const now = new Date();
      setLastRefreshTime(now);

      // Save prediction to Firebase
      savePredictionToFirebase(patternName, confidencePercentage)
          .then(() => console.log("Prediction saved successfully"))
          .catch(err => console.error("Error saving prediction:", err));
    } catch (err) {
      setError(`Prediction failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setPattern('Error');
      // setConfidence(0);
    } finally {
      setIsLoading(false);
    }
  }, [imageUrl, filename, apiEndpoint]);

  // Initial prediction on component mount or when imageUrl changes
  useEffect(() => {
    // Skip prediction if initial values were provided
    if (initialPattern && initialConfidence !== undefined) {
      return;
    }

    runPrediction();
  }, [imageUrl, filename, initialPattern, initialConfidence, runPrediction]);

  // Setup auto-refresh timer
  useEffect(() => {
    // Clear existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update countdown every second
    const countdownTimer = setInterval(() => {
      if (autoRefreshEnabled) {
        const elapsed = new Date().getTime() - lastRefreshTime.getTime();
        const remaining = Math.max(0, refreshInterval - elapsed);
        setTimeUntilNextRefresh(remaining);

        // If it's time to refresh
        if (remaining === 0) {
          runPrediction();
        }
      }
    }, 1000);

    // Set main refresh timer
    if (autoRefreshEnabled) {
      timerRef.current = setInterval(() => {
        runPrediction();
      }, refreshInterval);
    }

    // Cleanup on unmount
    return () => {
      clearInterval(countdownTimer);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefreshEnabled, lastRefreshTime, refreshInterval, runPrediction]);

  // Fetch historical prediction data from Firebase
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

    // Real Firebase fetch for production
    try {
      const history = await getPredictionHistory(20); // Get last 20 predictions
      setHistoricalData(history);
    } catch (err) {
      setHistoryError(`Failed to load historical data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Function to manually test saving to Firebase
  const testFirebaseSave = async () => {
    try {
      setSaveStatus("Testing Firebase connection...");

      const testPrediction = {
        timestamp: Timestamp.fromDate(new Date()),
        filename: 'test-fish.jpg',
        pattern: 'Test Pattern',
        confidence: 99,
        imageUrl: 'https://example.com/test-fish.jpg'
      };

      // Directly save to Firestore
      const docRef = await addDoc(collection(db, 'fishPredictions'), testPrediction);

      console.log("Test document written with ID:", docRef.id);
      setSaveStatus("Test successful! Check your Firestore database.");

      // Refresh history if showing
      if (showHistory) {
        fetchHistoricalData();
      }
    } catch (err) {
      console.error("Test save failed:", err);
      setSaveStatus(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      case 'Normal Swarm':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          icon: '→'
        };
      case 'Erratic Movement':
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
      case 'Normal Swarm':
        return "The fish are swimming together in a coordinated manner, indicating natural schooling behavior. This behavior persists and is consistent, the tank environment seems to be stable, with no signs of stress or external factors disturbing the fish.";
      case 'Erratic Movement':
        return "The fish are moving in irregular, chaotic, and disjointed patterns. This behavior is a strong signal that the fish are experiencing discomfort or stress. If this is a frequent or persistent behavior, immediate attention to water quality, tank temperature, and overall tank conditions is necessary.";
      case 'Clustering':
        return "Fish are grouped together but not moving cohesively. They appear to be in close proximity but may not be swimming in sync. This behavior is occasional, it might not indicate a major health issue, but it could suggest water quality fluctuations, a change in food patterns, or other mild disturbances.";
      case 'Loading...':
        return "Analyzing fish behavior pattern...";
      case 'Error':
        return "Unable to analyze fish behavior. Please try again.";
      default:
        return "Unrecognized fish behavior pattern.";
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format time remaining in MM:SS format
  const formatTimeRemaining = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

          {/* Auto-refresh controls */}
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-blue-800">Auto Refresh</div>
                <div className="text-xs text-blue-600">
                  {autoRefreshEnabled
                      ? `Next refresh in ${formatTimeRemaining(timeUntilNextRefresh)}`
                      : 'Auto refresh disabled'}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                    onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full ${autoRefreshEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${autoRefreshEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                />
                </button>
                <button
                    onClick={() => runPrediction()}
                    disabled={isLoading}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full"
                    title="Refresh now"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last updated: {formatDate(lastRefreshTime)}
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
              <div className="text-sm text-gray-500">Recommendation</div>
              <div className="mt-2 p-3 rounded-md bg-blue-50 text-blue-800 border border-blue-100">
                <div className="font-medium mb-1">Advice:</div>
                <p className="text-sm">{getBehaviorDescription(pattern)}</p>
              </div>
            </div>

            {/* Firestore save status */}
            {saveStatus && (
                <div className={`mt-4 p-3 ${saveStatus.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} rounded-md mb-4`}>
                  <p className="text-sm">{saveStatus}</p>
                </div>
            )}

            {/* Error message if any */}
            {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-md mb-4">
                  <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Test Firebase button */}
            <button
                onClick={testFirebaseSave}
                className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md mb-4"
            >
              Test Firebase Connection
            </button>

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
                        onClick={() => {
                          setUseSampleData(!useSampleData);
                          // Trigger data fetch when toggle changes
                          if (!useSampleData) {
                            setHistoricalData([]); // Clear existing data
                          }
                        }}
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

                                  <div className="text-xs text-gray-500">Advice</div>
                                  <div className="text-xs mt-1 text-blue-800">
                                    {getBehaviorDescription(item.pattern).substring(0, 100)}...
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