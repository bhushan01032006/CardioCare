import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AssessmentResult, PatientData } from '../types';
import { CheckCircle2, Activity, ShieldCheck, Download, Eye, RotateCcw } from 'lucide-react';
import jsPDF from 'jspdf';

interface RiskResultDisplayProps {
  result: AssessmentResult;
  data: PatientData;
  onReset: () => void;
}

export const RiskResultDisplay: React.FC<RiskResultDisplayProps> = ({ result, data, onReset }) => {
  const { riskLevel, riskScore, explanation, recommendations } = result;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return '#10b981'; // emerald-500
      case 'Medium': return '#f59e0b'; // amber-500
      case 'High': return '#ef4444'; // red-500
      default: return '#3b82f6';
    }
  };

  const color = getRiskColor(riskLevel);
  
  const chartData = [
    { name: 'Score', value: riskScore },
    { name: 'Remaining', value: 100 - riskScore }
  ];

  const generatePDF = async () => {
    // Ensure jsPDF is constructed correctly using default import
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Header Background
    doc.setFillColor(30, 41, 59); // Slate-900
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // --- LOGO GENERATION (SVG -> Canvas -> PNG) ---
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // SVG String (Dark variant colors: Hand #60a5fa, Heart #dc2626)
        const svgString = `
          <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 100 100">
            <path d="M15,75 C15,75 35,95 50,95 C65,95 85,75 85,75 L85,65 C85,65 65,85 50,85 C35,85 15,65 15,65 L15,75 Z" fill="#60a5fa"/>
            <path d="M85,65 L85,55 C85,55 95,50 95,65 C95,80 85,75 85,75" fill="#60a5fa" opacity="0.8"/>
            <path d="M15,65 L15,55 C15,55 5,50 5,65 C5,80 15,75 15,75" fill="#60a5fa" opacity="0.8"/>
            <path d="M50 25 C62 10 90 20 90 45 C90 65 50 85 50 85 C50 85 10 65 10 45 C10 20 38 10 50 25 Z" stroke="#dc2626" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        `;

        // Use document.createElement('img') to avoid conflict with potentially imported 'Image' constructors
        const img = document.createElement('img');
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        img.src = url;
        await new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });

        if (ctx) {
            ctx.drawImage(img, 0, 0);
            const pngData = canvas.toDataURL('image/png');
            // Add Logo to PDF at x=15, y=10, size=30x30
            doc.addImage(pngData, 'PNG', 15, 10, 30, 30);
        }
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Failed to generate logo for PDF", e);
    }
    
    // --- HEADER TEXT ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    
    // Shift text to right to accommodate logo
    const titleX = 50; 

    // "CARDIO" in Blue-300
    doc.setTextColor(147, 197, 253); 
    doc.text('CARDIO', titleX, 28);
    
    // "CARE" in Red-500
    const textWidth = doc.getTextWidth('CARDIO');
    doc.setTextColor(239, 68, 68); 
    doc.text('CARE', titleX + textWidth + 1, 28);
    
    // "Foundation" Subtitle
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225); // Slate-300
    doc.setCharSpace(2);
    doc.text('FOUNDATION', titleX, 35);
    doc.setCharSpace(0);

    // Meta Data
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, pageWidth - 20, 32, { align: 'right' });

    // Patient Details
    let currentY = 70;
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFontSize(14);
    doc.text('Patient Information', 20, currentY);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 15;

    doc.setFontSize(11);
    
    // Row 1
    doc.text(`Name: ${data.name}`, 20, currentY);
    doc.text(`Age: ${data.age}`, 85, currentY);
    doc.text(`Gender: ${data.gender}`, 150, currentY);
    currentY += 10;
    
    // Row 2
    doc.text(`Blood Group: ${data.bloodGroup}`, 20, currentY);
    doc.text(`Height: ${data.height} cm`, 85, currentY);
    doc.text(`Weight: ${data.weight} kg`, 150, currentY);
    currentY += 10;

    // Row 3
    doc.text(`Smoking: ${data.smoking ? 'Yes' : 'No'}`, 20, currentY);
    doc.text(`Diabetes: ${data.diabetes ? 'Yes' : 'No'}`, 85, currentY);
    
    // Clinical Vitals
    currentY += 20;
    doc.setFontSize(14);
    doc.text('Clinical Metrics', 20, currentY);
    doc.line(20, currentY + 3, 190, currentY + 3);
    currentY += 15;

    doc.setFontSize(11);
    doc.text(`Blood Pressure: ${data.bloodPressure} mmHg`, 20, currentY);
    doc.text(`Heart Rate: ${data.heartRate} bpm`, 85, currentY);
    doc.text(`Cholesterol: ${data.cholesterol} mg/dL`, 150, currentY);
    currentY += 15;

    if (data.symptoms) {
        doc.text('Reported Symptoms:', 20, currentY);
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        const splitSymptoms = doc.splitTextToSize(data.symptoms, 170);
        doc.text(splitSymptoms, 20, currentY + 6);
        doc.setTextColor(30, 41, 59);
        currentY += 15 + (splitSymptoms.length * 5);
    } else {
        currentY += 5;
    }

    // Risk Assessment
    currentY += 10;
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(15, currentY, pageWidth - 30, 45, 'F');
    
    doc.setFontSize(14);
    doc.text('Assessment Results', 25, currentY + 15);
    
    doc.setFontSize(18);
    // Dynamic color for Risk Level text
    if (riskLevel === 'High') doc.setTextColor(220, 38, 38);
    else if (riskLevel === 'Medium') doc.setTextColor(217, 119, 6);
    else doc.setTextColor(5, 150, 105);

    doc.text(`Risk Level: ${riskLevel.toUpperCase()}`, 25, currentY + 30);
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Calculated Score: ${riskScore}/100`, 130, currentY + 30);

    // Recommendations
    currentY += 65;
    doc.setFontSize(14);
    doc.text('Medical Recommendations', 20, currentY);
    doc.line(20, currentY + 3, 190, currentY + 3);

    doc.setFontSize(11);
    let recY = currentY + 15;
    recommendations.forEach((rec) => {
        doc.text(`• ${rec}`, 25, recY);
        recY += 10;
    });

    return doc;
  };

  const handleDownload = async () => {
    await generatePDF().then(doc => {
        if (doc) doc.save(`CardioCare_Report_${data.name.replace(/\s+/g, '_')}.pdf`);
    });
  };

  const handleViewReport = async () => {
    await generatePDF().then(doc => {
        if (doc) window.open(doc.output('bloburl'), '_blank');
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/50 ring-1 ring-slate-900/5">
        
        {/* Modern Header */}
        <div className="relative overflow-hidden bg-slate-900 px-6 py-12 sm:px-12 text-center">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400 via-slate-900 to-slate-900"></div>
            <div className="relative z-10 flex flex-col items-center">
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider mb-4 bg-white/10 text-white backdrop-blur-md border border-white/10`}>
                    <Activity className="w-4 h-4" style={{ color }} />
                    Result Ready
                </span>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
                    <span style={{ color }}>{riskLevel}</span> Risk Profile
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto text-lg">
                    Based on the vital signs provided, here is your personalized cardiovascular assessment.
                </p>
            </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Col: Chart & Score */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="relative w-56 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell key="cell-0" fill={color} />
                        <Cell key="cell-1" fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold text-slate-900">{riskScore}</span>
                    <span className="text-sm font-medium text-slate-500 uppercase tracking-wide mt-1">Risk Score</span>
                  </div>
               </div>
               <div className="mt-6 w-full">
                  <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${riskScore}%`, backgroundColor: color }}></div>
                  </div>
               </div>
            </div>

            {/* Right Col: Explanation & Recs */}
            <div className="lg:col-span-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  AI Health Analysis
                </h3>
                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 text-slate-700 leading-relaxed text-base">
                  {explanation}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Action Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center border-t border-slate-100 pt-8">
             <button
              onClick={handleViewReport}
              className="flex-1 sm:flex-none group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-slate-700 rounded-xl hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-500/30"
            >
              <Eye className="w-5 h-5 mr-2" />
              View Report
            </button>

             <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 rounded-xl hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Report
            </button>
             
             <button
              onClick={onReset}
              className="flex-1 sm:flex-none group relative inline-flex items-center justify-center px-8 py-4 font-semibold text-slate-700 transition-all duration-200 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300"
            >
              <RotateCcw className="w-4 h-4 mr-2 group-hover:-rotate-180 transition-transform duration-500" />
              New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};