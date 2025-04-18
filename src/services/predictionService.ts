// src/services/predictionService.ts
import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp,
    DocumentData,
    QueryDocumentSnapshot
} from 'firebase/firestore';

// Interface for prediction data
export interface PredictionRecord {
    timestamp: Date;
    filename: string;
    pattern: string;
    confidence: number;
    imageUrl: string;
}

// Interface for Firestore document
interface FirestorePrediction {
    timestamp: Timestamp;
    filename: string;
    pattern: string;
    confidence: number;
    imageUrl: string;
}

// Collection name in Firestore
const PREDICTION_COLLECTION = 'fishPredictions';

/**
 * Save a new prediction record to Firestore
 */
export const savePrediction = async (prediction: PredictionRecord): Promise<string> => {
    try {
        // Convert date to Firestore timestamp
        const firestorePrediction: FirestorePrediction = {
            ...prediction,
            timestamp: Timestamp.fromDate(prediction.timestamp)
        };

        // Add document to collection
        const docRef = await addDoc(
            collection(db, PREDICTION_COLLECTION),
            firestorePrediction
        );

        return docRef.id;
    } catch (error) {
        console.error('Error saving prediction to Firestore:', error);
        throw error;
    }
};

/**
 * Get prediction history from Firestore
 * @param limit Maximum number of records to retrieve
 */
export const getPredictionHistory = async (limitCount: number = 20): Promise<PredictionRecord[]> => {
    try {
        // Create query to get recent predictions, ordered by timestamp
        const q = query(
            collection(db, PREDICTION_COLLECTION),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        // Execute query
        const querySnapshot = await getDocs(q);

        // Convert Firestore documents to PredictionRecord objects
        const predictions: PredictionRecord[] = [];

        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data() as FirestorePrediction;

            // Convert Firestore timestamp to JavaScript Date
            predictions.push({
                ...data,
                timestamp: data.timestamp.toDate()
            });
        });

        return predictions;
    } catch (error) {
        console.error('Error fetching prediction history from Firestore:', error);
        throw error;
    }
};