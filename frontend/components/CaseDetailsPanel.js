'use client';
'use client';

import { useState } from 'react';

export default function CaseDetailsPanel({ caseData }) {
  const [selectedImaging, setSelectedImaging] = useState(null);
  if (!caseData) {
    return(
      <div className="bg-surface rounded-xl shadow-lg p-6 border border-border">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-lg p-6 h-fit border border-border">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
        <svg className="h-5 w-5 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        Patient Information
      </h2>
      
      <div className="space-y-4">
        <div className="border-b border-border pb-4">
          <h3 className="font-semibold text-foreground mb-2">Demographics</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-foreground">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{caseData.patient_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span>
              <p className="font-medium">{caseData.age} years</p>
            </div>
            <div>
              <span className="text-muted-foreground">Gender:</span>
              <p className="font-medium">{caseData.gender}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-border pb-4">
          <h3 className="font-semibold text-foreground mb-2">Chief Complaint</h3>
          <p className="text-sm text-foreground/90">{caseData.chief_complaint}</p>
        </div>

        <div className="border-b border-border pb-4">
          <h3 className="font-semibold text-foreground mb-2">Medical History</h3>
          <p className="text-sm text-foreground/90">{caseData.history}</p>
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center">
            <svg className="h-4 w-4 text-medical mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Vital Signs
          </h3>
          <div className="grid grid-cols-1 gap-3 text-sm">
            {caseData.vitals && Object.entries(caseData.vitals).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 px-3 bg-elevated/40 border border-border rounded-md">
                <span className="text-muted-foreground capitalize">
                  {key.replace('_', ' ')}:
                </span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Imaging Section */}
        {caseData.medical_imaging && (
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-foreground mb-3 flex items-center">
              <svg className="h-4 w-4 text-medical mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Medical Imaging
            </h3>
            <div className="space-y-3">
              {Object.entries(caseData.medical_imaging).map(([imagingType, details]) => (
                <div key={imagingType} className="bg-elevated/40 border border-border rounded-md p-3">
                  <button
                    onClick={() => setSelectedImaging(selectedImaging === imagingType ? null : imagingType)}
                    className="w-full flex items-center justify-between text-left text-sm font-medium text-foreground hover:text-medical transition-colors"
                  >
                    <span className="capitalize">
                      {imagingType.replace('_', ' ')}
                      {imagingType.includes('ct') && ' Scan'}
                      {imagingType.includes('mri') && ' Scan'}
                      {imagingType.includes('xray') && ' (X-ray)'}
                      {imagingType.includes('ultrasound') && ' Ultrasound'}
                      {imagingType.includes('ecg') && ' (ECG)'}
                      {imagingType.includes('echocardiogram') && ' (Echo)'}
                    </span>
                    <svg 
                      className={`h-4 w-4 transition-transform ${selectedImaging === imagingType ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {selectedImaging === imagingType && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-2">{details.description}</p>
                      <div className="space-y-1">
                        <h5 className="text-xs font-medium text-foreground">Key Findings:</h5>
                        <ul className="text-xs text-foreground/80 space-y-1">
                          {details.findings.map((finding, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-medical mr-1">•</span>
                              {finding}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}