export interface PatientData {
  name: string;
  age: number | '';
  gender: 'Male' | 'Female' | '';
  height: number | '';
  weight: number | '';
  bloodGroup: string;
  cholesterol: number | '';
  bloodPressure: number | '';
  heartRate: number | '';
  diabetes: boolean;
  smoking: boolean;
  symptoms: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High';

export interface AssessmentResult {
  riskLevel: RiskLevel;
  riskScore: number;
  explanation: string;
  recommendations: string[];
}

export interface SavedReport {
  id: string;
  date: string;
  data: PatientData;
  result: AssessmentResult;
}