"""
ML Model Training Script
Generates synthetic data and trains scholarship eligibility prediction model
Run this script to generate the models needed by the prediction service
"""

import numpy as np
import pandas as pd
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Random seed for reproducibility
np.random.seed(42)


def generate_synthetic_data(n_samples=500):
    """
    Generate synthetic training data for scholarship eligibility
    
    Features:
    - age: Student age (13-30)
    - category: Social category (General=0, OBC=1, SC=2, ST=3)
    - income: Annual family income in INR
    - education_level: Education level (10th=0, 12th=1, Bachelor=2, Master=3, PhD=4)
    - stream: Education stream (Arts=0, Commerce=1, Science=2, Engineering=3)
    
    Target:
    - eligible: 1 if eligible for any scholarship, 0 otherwise
    
    Args:
        n_samples (int): Number of synthetic samples to generate
        
    Returns:
        tuple: (X, y) feature matrix and target labels
    """
    
    print(f"🔄 Generating {n_samples} synthetic samples...")
    
    data = {
        'age': np.random.randint(13, 31, n_samples),
        'category': np.random.randint(0, 4, n_samples),  # 0-3
        'income': np.random.uniform(100000, 5000000, n_samples),
        'education_level': np.random.randint(0, 5, n_samples),  # 0-4
        'stream': np.random.randint(0, 4, n_samples)  # 0-3
    }
    
    X = pd.DataFrame(data)
    
    # Generate target variable with rules
    # Eligibility based on income, category, and education
    y = []
    
    for idx, row in X.iterrows():
        score = 0.5  # Base score
        
        # Income factor (lower income = higher chance)
        if row['income'] < 200000:
            score += 0.25
        elif row['income'] < 500000:
            score += 0.15
        elif row['income'] < 1000000:
            score += 0.05
        
        # Category factor (reserved categories have advantage)
        if row['category'] in [2, 3]:  # SC, ST
            score += 0.20
        elif row['category'] == 1:  # OBC
            score += 0.10
        
        # Education factor
        if row['education_level'] >= 2:  # Bachelor or higher
            score += 0.10
        
        # Add some randomness
        score += np.random.normal(0, 0.05)
        
        # Threshold at 0.6
        eligible = 1 if score >= 0.6 else 0
        y.append(eligible)
    
    y = np.array(y)
    
    # Class distribution
    eligible_count = np.sum(y)
    print(f"✓ Data generated: {eligible_count} eligible, {n_samples - eligible_count} ineligible")
    
    return X, y


def train_model(X, y, test_size=0.2):
    """
    Train RandomForest classifier for scholarship eligibility
    
    Args:
        X (pd.DataFrame): Feature matrix
        y (np.array): Target labels
        test_size (float): Proportion of data for testing
        
    Returns:
        tuple: (trained_model, scaler, X_test, y_test, X_train, y_train)
    """
    
    print("\n🔄 Training model...")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced'  # Handle class imbalance
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    
    print(f"✓ Model trained successfully")
    print(f"\n📊 Model Metrics:")
    print(f"   Accuracy:  {accuracy:.4f}")
    print(f"   Precision: {precision:.4f}")
    print(f"   Recall:    {recall:.4f}")
    print(f"   F1-Score:  {f1:.4f}")
    
    # Feature importance
    feature_names = ['age', 'category', 'income', 'education_level', 'stream']
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print(f"\n📈 Feature Importance:")
    for idx, row in feature_importance.iterrows():
        bar_length = int(row['importance'] * 50)
        bar = '█' * bar_length
        print(f"   {row['feature']:20s} {bar} {row['importance']:.4f}")
    
    return model, scaler, X_test_scaled, y_test, X_train_scaled, y_train


def save_model(model, scaler, output_dir='models'):
    """
    Save trained model and scaler to disk
    
    Args:
        model: Trained model object
        scaler: Fitted scaler object
        output_dir (str): Directory to save files
    """
    
    print(f"\n💾 Saving model files...")
    
    # Create directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save model
    model_path = os.path.join(output_dir, 'scholarship_model.pkl')
    joblib.dump(model, model_path)
    print(f"   ✓ Model saved: {model_path}")
    
    # Save scaler
    scaler_path = os.path.join(output_dir, 'feature_scaler.pkl')
    joblib.dump(scaler, scaler_path)
    print(f"   ✓ Scaler saved: {scaler_path}")
    
    return model_path, scaler_path


def test_model_prediction(model, scaler):
    """
    Test the trained model with sample predictions
    
    Args:
        model: Trained model object
        scaler: Fitted scaler object
    """
    
    print(f"\n🧪 Testing model with sample predictions...")
    
    # Test samples
    test_samples = [
        {'age': 20, 'category': 2, 'income': 150000, 'education_level': 1, 'stream': 2},  # SC, low income
        {'age': 22, 'category': 0, 'income': 1000000, 'education_level': 2, 'stream': 0},  # General, high income
        {'age': 18, 'category': 1, 'income': 300000, 'education_level': 1, 'stream': 3},  # OBC, mid income
    ]
    
    for sample in test_samples:
        X_sample = pd.DataFrame([sample])
        X_scaled = scaler.transform(X_sample)
        
        # Get prediction and probability
        prediction = model.predict(X_scaled)[0]
        probability = model.predict_proba(X_scaled)[0][1]
        
        category_names = {0: 'General', 1: 'OBC', 2: 'SC', 3: 'ST'}
        education_names = {0: '10th', 1: '12th', 2: 'Bachelor', 3: 'Master', 4: 'PhD'}
        stream_names = {0: 'Arts', 1: 'Commerce', 2: 'Science', 3: 'Engineering'}
        
        print(f"\n   Test Sample:")
        print(f"      Age: {sample['age']}, Category: {category_names[sample['category']]}")
        print(f"      Income: ₹{sample['income']:,}, Education: {education_names[sample['education_level']]}")
        print(f"      Stream: {stream_names[sample['stream']]}")
        print(f"      📊 Eligible: {'✓ Yes' if prediction == 1 else '✗ No'} (Confidence: {probability:.2%})")


def main():
    """Main training script"""
    
    print("\n" + "="*60)
    print(" 🎓 AI Scholarship Eligibility Model Training")
    print("="*60 + "\n")
    
    try:
        # Generate synthetic data
        X, y = generate_synthetic_data(n_samples=500)
        
        # Train model
        model, scaler, X_test, y_test, X_train, y_train = train_model(X, y)
        
        # Save model and scaler
        model_path, scaler_path = save_model(model, scaler)
        
        # Test with sample predictions
        test_model_prediction(model, scaler)
        
        print("\n" + "="*60)
        print("✅ Training completed successfully!")
        print("="*60 + "\n")
        print(f"Models ready for deployment:")
        print(f"  - {model_path}")
        print(f"  - {scaler_path}\n")
        
        return model, scaler, model_path, scaler_path
    
    except Exception as e:
        print(f"\n❌ Error during training: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, None, None, None


if __name__ == '__main__':
    main()
