import React, { useState } from 'react';
import type { FormField } from '../types';
import { saveFilledForm, validateFormFields } from '../utils/formUtils';
import { downloadPDF } from '../utils/pdfManipulation';

interface FormToolbarProps {
  pdfData: Uint8Array | null;
  formFields: FormField[];
  hasFormFields: boolean;
  onSave?: (pdfData: Uint8Array) => void;
}

const FormToolbar: React.FC<FormToolbarProps> = ({ 
  pdfData, 
  formFields, 
  hasFormFields,
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!hasFormFields || !pdfData) {
    return null;
  }

  const handleSaveForm = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      const validation = validateFormFields(formFields);
      if (!validation.isValid) {
        setError(`Please fill in required fields: ${validation.errors.join(', ')}`);
        setIsSaving(false);
        return;
      }

      const filledPdfData = await saveFilledForm(pdfData, formFields);

      if (onSave) {
        onSave(filledPdfData);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving form:', err);
      setError('Failed to save form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadForm = async () => {
    try {
      setError(null);
      setSuccess(false);
      setIsSaving(true);

      const validation = validateFormFields(formFields);
      if (!validation.isValid) {
        setError(`Please fill in required fields: ${validation.errors.join(', ')}`);
        setIsSaving(false);
        return;
      }

      const filledPdfData = await saveFilledForm(pdfData, formFields);

      const filename = `filled-form-${new Date().toISOString().split('T')[0]}.pdf`;
      downloadPDF(filledPdfData, filename);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error downloading form:', err);
      setError('Failed to download form. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear all form fields?')) {
      window.location.reload();
    }
  };

  return (
    <div className="form-toolbar">
      <div className="form-toolbar-content">
        <div className="form-toolbar-info">
          <svg 
            className="form-icon" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <span className="form-toolbar-text">
            Interactive Form ({formFields.length} field{formFields.length !== 1 ? 's' : ''})
          </span>
        </div>

        <div className="form-toolbar-actions">
          <button
            onClick={handleClearForm}
            className="form-toolbar-button form-toolbar-button-secondary"
            disabled={isSaving}
          >
            Clear
          </button>
          <button
            onClick={handleSaveForm}
            className="form-toolbar-button form-toolbar-button-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Form'}
          </button>
          <button
            onClick={handleDownloadForm}
            className="form-toolbar-button form-toolbar-button-primary"
            disabled={isSaving}
          >
            {isSaving ? 'Downloading...' : 'Download Filled Form'}
          </button>
        </div>
      </div>

      {error && (
        <div className="form-toolbar-message form-toolbar-error">
          {error}
        </div>
      )}

      {success && (
        <div className="form-toolbar-message form-toolbar-success">
          Form saved successfully!
        </div>
      )}
    </div>
  );
};

export default FormToolbar;

