import { PatientData, AssessmentResult } from "../types";

export const assessHeartRisk = async (data: PatientData): Promise<AssessmentResult> => {
  // Simulate analysis delay for better User Experience
  await new Promise(resolve => setTimeout(resolve, 1500));

  let score = 0;
  const recommendations: string[] = [];
  let explanation = "Based on the clinical data provided, ";

  // --- 1. Age Factor ---
  const age = Number(data.age);
  if (age > 65) score += 20;
  else if (age > 50) score += 15;
  else if (age > 35) score += 5;

  // --- 2. BMI Calculation (Body Mass Index) ---
  const heightM = Number(data.height) / 100;
  const weightKg = Number(data.weight);
  const bmi = weightKg / (heightM * heightM);
  
  if (bmi > 35) {
      score += 15;
      recommendations.push("Your BMI indicates severe obesity. A structured weight management plan is critical.");
  } else if (bmi > 30) {
      score += 10;
      recommendations.push("Your BMI indicates obesity. Incorporate 30 mins of daily cardio and reduce calorie intake.");
  } else if (bmi > 25) {
      score += 5;
      recommendations.push("You are slightly overweight. Focus on a balanced diet and regular activity.");
  }

  // --- 3. Clinical Vitals (Blood Pressure) ---
  const bp = Number(data.bloodPressure);
  if (bp > 160) {
      score += 25;
      recommendations.push("Your blood pressure is dangerously high (Stage 2 Hypertension). Seek medical care immediately.");
  } else if (bp > 140) {
      score += 15;
      recommendations.push("High blood pressure detected. Reduce sodium intake and monitor daily.");
  } else if (bp > 120) {
      score += 5;
  }

  // --- 4. Clinical Vitals (Cholesterol) ---
  const chol = Number(data.cholesterol);
  if (chol > 240) {
      score += 15;
      recommendations.push("High cholesterol levels. Limit saturated fats (red meat, dairy) and increase fiber.");
  } else if (chol > 200) {
      score += 5;
  }

  // --- 5. Lifestyle & History ---
  if (data.smoking) {
      score += 25;
      recommendations.push("Smoking is the single biggest preventable risk factor. Immediate cessation is strongly advised.");
  }
  if (data.diabetes) {
      score += 20;
      recommendations.push("Diabetes doubles your risk of heart disease. Strict blood sugar control is essential.");
  }

  // --- 6. Symptoms Analysis (Keyword matching) ---
  const s = (data.symptoms || '').toLowerCase();
  const criticalKeywords = ['chest pain', 'tightness', 'shortness of breath', 'fainting', 'palpitations', 'arm pain', 'jaw pain'];
  const hasCriticalSymptoms = criticalKeywords.some(keyword => s.includes(keyword));

  if (hasCriticalSymptoms) {
      score += 30; // Significant jump
      recommendations.unshift("URGENT: Your reported symptoms are consistent with cardiac distress. Consult a doctor immediately.");
  }

  // --- 7. Final Scoring & Logic ---
  // Cap score between 1 and 99
  score = Math.min(score, 99);
  score = Math.max(score, 1);

  // Determine Risk Level
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  
  if (score >= 60) {
      riskLevel = 'High';
      explanation += `your risk profile is categorized as HIGH (${score}/100). Several critical factors such as ${bp > 140 ? 'blood pressure, ' : ''}${data.smoking ? 'smoking history, ' : ''}and ${data.diabetes ? 'diabetes status' : 'clinical metrics'} are contributing to this score.`;
      if (recommendations.length < 3) recommendations.push("Schedule a full cardiac checkup with a specialist.");
  } else if (score >= 30) {
      riskLevel = 'Medium';
      explanation += `your risk profile is MODERATE (${score}/100). While not immediately critical, factors like ${bmi > 25 ? 'weight' : 'age'} and lifestyle choices suggest room for improvement to prevent future complications.`;
  } else {
      explanation += `your risk profile is LOW (${score}/100). Your vitals and lifestyle choices appear to be within a healthy range. Keep up the good work!`;
      if (recommendations.length === 0) {
          recommendations.push("Maintain a heart-healthy diet rich in fruits, vegetables, and whole grains.");
          recommendations.push("Continue engaging in at least 150 minutes of moderate aerobic activity per week.");
          recommendations.push("Ensure you get 7-9 hours of quality sleep nightly.");
      }
  }

  // Ensure we always have recommendations
  if (recommendations.length === 0) {
      recommendations.push("Routine health checkups are recommended to monitor vitals.");
  }

  return {
    riskScore: Math.round(score),
    riskLevel,
    explanation,
    recommendations: recommendations.slice(0, 4) // Return top 4 unique recommendations
  };
};