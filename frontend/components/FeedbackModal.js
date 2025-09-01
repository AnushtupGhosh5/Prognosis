'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedbackModal({ isOpen, onClose, sessionId, onSubmit }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!diagnosis.trim() || !treatment.trim()) {
      setError('Please provide both diagnosis and treatment plan');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(diagnosis.trim(), treatment.trim());
      // Redirect to feedback page
      router.push(`/feedback/${sessionId}`);
    } catch (err) {
      setError(err.message || 'Failed to submit diagnosis');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border shadow-xl">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground flex items-center">
              <svg className="h-6 w-6 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submit Your Diagnosis
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on your patient interview, provide your diagnosis and treatment plan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="diagnosis" className="block text-sm font-medium text-foreground mb-2">
              Primary Diagnosis *
            </label>
            <textarea
              id="diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Enter your primary diagnosis based on the patient's symptoms and history..."
              className="input w-full"
              rows="3"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Be specific and include your reasoning
            </p>
          </div>

          <div>
            <label htmlFor="treatment" className="block text-sm font-medium text-foreground mb-2">
              Treatment Plan *
            </label>
            <textarea
              id="treatment"
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Describe your immediate treatment plan, including medications, procedures, and follow-up care..."
              className="input w-full"
              rows="4"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include immediate interventions and ongoing management
            </p>
          </div>

          {error && (
            <div className="rounded-md border border-error/20 bg-error/10 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-error">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2 text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Diagnosis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
